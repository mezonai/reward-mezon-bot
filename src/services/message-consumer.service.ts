import { rabbitMQService, consumeMessages } from "./rabbitmq.service";
import { RedisService } from "./redis.service";
import User from "../models/User";
import { enumBot, startsWithSpecialChar } from "../ultis/constant";
import { rewardToolService } from "./call_tool.service";
import { messageService } from "./message.service";
import { EmbedProps } from "../ultis/form";
import { getRandomColor } from "../ultis/color";

export class MessageConsumerService {
  private rabbitmq = rabbitMQService;
  private redis: RedisService;

  constructor() {
    this.redis = new RedisService();
  }

  async initialize() {
    await this.rabbitmq.connect();
    await this.redis.connect();
  }

  async start() {
    await this.initialize();
    await consumeMessages(async (message) => {
      await this.processMessage(message);
    });
  }

  async processMessage(message: any) {
    try {
      if (message.type === "create_image") {
        await this.processImageCreation(message);
        return;
      }
      const { username, sender_id, content } = message;
      if (
        !sender_id ||
        username === "Anonymous" ||
        enumBot.some((bot) => username.includes(bot)) ||
        startsWithSpecialChar(content?.t) ||
        sender_id === process.env.BOT
      ) {
        return;
      }
      await this.redis.checkAndIncrementCount(sender_id);
    } catch (error) {
      console.error("Error processing message:", error);
      throw error;
    }
  }

  private async processImageCreation(message: any) {
    try {
      const { question, message: msgData } = message;
      const result = await rewardToolService.sendMessage(
        msgData,
        question,
        "create_image"
      );

      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const embed: EmbedProps[] = [
          {
            color: getRandomColor(),
            image: {
              url: result.content[0]?.text,
            },
            timestamp: new Date().toISOString(),
            footer: {
              text: "Powered by Bot-reward",
              icon_url:
                "https://cdn.mezon.vn/1837043892743049216/1840654271217930240/1827994776956309500/857_0246x0w.webp",
            },
          },
        ];

        await messageService.updateEmbed(
          msgData.channel_id,
          embed,
          msgData.message_id
        );
      }
    } catch (error) {
      console.error("Error processing image creation:", error);
      throw error;
    }
  }

  async syncMessageCounts() {
    try {
      const users = await User.findAll();
      for (const user of users) {
        const redisData = await this.redis.getData(user.user_id);
        if (redisData) {
          await user.update({
            countmessage:
              Number(redisData.count) + Number(user.countmessage) ||
              user.countmessage,
          });
          await this.redis.deleteData(user.user_id);
        }
      }
    } catch (error) {
      console.error("Error synchronizing message counts:", error);
      throw error;
    }
  }
}

export const messageConsumer = new MessageConsumerService();
