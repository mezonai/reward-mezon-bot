import { EMarkdownType } from "mezon-sdk";
import { client } from "../config/mezon-client";
import { EmbedProps } from "../ultis/form";

export class MessageService {
  async updateMessage(message: string, channel_id: string, message_id: string) {
    try {
      const Channel = await client.channels.fetch(channel_id);
      const fetchedMessage = await Channel.messages.fetch(message_id);
      await fetchedMessage.update({
        t: message,
        mk: [
          {
            type: EMarkdownType.PRE,
            s: 0,
            e: message.length,
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
      return await fetchedMessage.reply({
        t: message,
        mk: [
          {
            type: EMarkdownType.PRE,
            s: 0,
            e: message.length,
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
      return await channel.send({
        t: message,
        mk: [
          {
            type: EMarkdownType.PRE,
            s: 0,
            e: message.length,
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
