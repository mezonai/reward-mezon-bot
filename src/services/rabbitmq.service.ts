import * as amqp from "amqplib";
import { configRabbitMQ } from "../config/rabbitmq.config";

export class RabbitMQService {
  private static instance: RabbitMQService;
  private connection: any = null;
  private channel: amqp.Channel | null = null;
  private readonly queueName = "message_queue";
  private isConnecting: boolean = false;

  private constructor() {}

  public static getInstance(): RabbitMQService {
    if (!RabbitMQService.instance) {
      RabbitMQService.instance = new RabbitMQService();
    }
    return RabbitMQService.instance;
  }

  async connect() {
    if (this.connection) {
      return;
    }
    if (this.isConnecting) {
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }
    try {
      this.isConnecting = true;
      this.connection = await amqp.connect(configRabbitMQ.rabbitmq.url);
      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error("Failed to create channel");
      }
      await this.channel.assertQueue(this.queueName, {
        durable: true,
      });
    } catch (error) {
      console.error("Error connecting to RabbitMQ:", error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async publishMessage(message: any) {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }
    try {
      await this.channel.sendToQueue(
        this.queueName,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
    } catch (error) {
      console.error("Error publishing message:", error);
      throw error;
    }
  }

  async consumeMessages(callback: (message: any) => Promise<void>) {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    try {
      await this.channel.consume(this.queueName, async (msg) => {
        if (msg) {
          const content = JSON.parse(msg.content.toString());
          try {
            await callback(content);
            this.channel?.ack(msg);
          } catch (error) {
            console.error("Error processing message:", error);
            this.channel?.nack(msg, false, true);
          }
        }
      });
    } catch (error) {
      console.error("Error consuming messages:", error);
      throw error;
    }
  }

  async close() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.channel = null;
      this.connection = null;
      console.log("RabbitMQ connection closed");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
      throw error;
    }
  }
}

export const rabbitMQService = RabbitMQService.getInstance();

export const connect = rabbitMQService.connect.bind(rabbitMQService);
export const publicMessage =
  rabbitMQService.publishMessage.bind(rabbitMQService);
export const consumeMessages =
  rabbitMQService.consumeMessages.bind(rabbitMQService);
export const close = rabbitMQService.close.bind(rabbitMQService);
