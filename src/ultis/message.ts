import { EMarkdownType } from "mezon-sdk";
import { client } from "../config/mezon-client";
import { formatMessage } from "./constant";
import { EmbedProps } from "./form";

export class MessageService {
  async updateMessage(message: any, channel_id: string, message_id: string) {
    try {
      const updateMessage = formatMessage(message);
      const Channel = await client.channels.fetch(channel_id);
      const fetchedMessage = await Channel.messages.fetch(message_id);
      await fetchedMessage.update({
        t: updateMessage,
        mk: [
          {
            type: EMarkdownType.TRIPLE,
            s: 0,
            e: updateMessage.length,
          },
        ],
      });
    } catch (error) {
      console.log(error);
    }
  }

  async replyMessage(channel_id: string, message: string, message_id: string) {
    try {
      const fetchedChannel = await client.channels.fetch(channel_id);
      const fetchedMessage = await fetchedChannel.messages.fetch(message_id);
      const repyMessage = formatMessage(message);
      await fetchedMessage.reply({
        t: repyMessage,
        mk: [
          {
            type: EMarkdownType.TRIPLE,
            s: 0,
            e: repyMessage.length,
          },
        ],
      });
    } catch (err) {
      console.error(err);
    }
  }

  async sendMessage(channel_id: string, message: string) {
    try {
      const channel = await client.channels.fetch(channel_id);
      const repyMessage = formatMessage(message);
      return await channel.send({
        t: repyMessage,
        mk: [
          {
            type: EMarkdownType.TRIPLE,
            s: 0,
            e: repyMessage.length,
          },
        ],
      });
    } catch (err) {
      console.error(err);
    }
  }

  async updateEmbed(
    channel_id: string,
    embed: EmbedProps[],
    message_id: string
  ) {
    try {
      const fetchedChannel = await client.channels.fetch(channel_id);
      const messages = fetchedChannel.messages.values();
      const fetchedMessage = await fetchedChannel.messages.fetch(message_id!);
      return await fetchedMessage.update({ embed });
    } catch (err) {
      console.error(err);
    }
  }
}

export const messageService = new MessageService();

export const updateMessage = messageService.updateMessage.bind(messageService);
export const replyMessage = messageService.replyMessage.bind(messageService);
export const sendMessage = messageService.sendMessage.bind(messageService);
export const updateEmbed = messageService.updateEmbed.bind(messageService);
