import { ChannelMessage } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { rewardToolService } from "../services/call_tool.service";
import { replyMessage, sendMessage } from "../services/message.service";
import Reward from "../models/Reward";
import { embedTrophy, components } from "../ultis/form";
import {
  checkAnonymous,
  formatListTrophy,
  formatListTrophyUser,
} from "../ultis/constant";
import { client } from "../config/mezon-client";

type TrophyAction = "new" | "upd" | "del";

interface ServiceResult {
  content?: Array<{ text?: string }>;
}

interface FetchedMessage {
  reply(options: { embed: any; components: any }): Promise<any>;
}

export class TrophyCommand extends CommandMessage {
  async execute(args: string[], message: ChannelMessage, commandName?: string) {
    try {
      if (checkAnonymous(message.username!)) {
        await replyMessage(
          message.channel_id,
          "You must mention a valid member or provide a valid user ID or user not found!",
          message?.message_id!
        );
        return;
      }
      if (commandName === "trophy") {
        await this.handleTrophyCommand(args, message);
      } else if (commandName === "list_trophy") {
        await this.handleListTrophyCommand(message);
      } else if (commandName === "trophies") {
        await this.handleTrophiesCommand(message);
      }
    } catch (error) {
      await this.handleError(message.channel_id, error);
    }
  }

  private async handleTrophiesCommand(message: ChannelMessage) {
    const result = await rewardToolService.trophyUser(
      message?.mentions?.[0]?.user_id!
        ? message?.mentions?.[0]?.user_id!
        : message?.sender_id!,
      message.clan_id!
    );
    if (
      result &&
      Array.isArray(result.content) &&
      typeof result.content[0]?.text === "string"
    ) {
      const text = formatListTrophyUser(JSON.parse(result.content[0].text));

      await replyMessage(message.channel_id, text, message?.message_id!);
    } else {
      await sendMessage(
        message.channel_id,
        "Error: Unable to process the returned result."
      );
    }
  }

  private async handleTrophyCommand(args: string[], message: ChannelMessage) {
    const fullArg = args.join(" ");
    const [action, name, description, points] = fullArg
      .split("|")
      .map((s) => s.trim());

    if (!action) {
      await replyMessage(
        message.channel_id,
        "Missing action information (new/upd/del)",
        message.message_id!
      );
      return;
    }

    const fetchedMessage = await this.fetchMessage(message);
    if (!fetchedMessage) return;

    switch (action as TrophyAction) {
      case "del":
        await this.handleDeleteTrophy(message, name, description, points);
        break;
      case "upd":
        await this.handleUpdateTrophy(message, fetchedMessage, name);
        break;
      case "new":
        await fetchedMessage.reply({
          embed: embedTrophy("trophy", "new"),
          components: components("trophy", "new"),
        });
        break;
      default:
        await replyMessage(
          message.channel_id,
          `Invalid action: ${action}. Use new/upd/del.`,
          message.message_id!
        );
    }
  }

  private async fetchMessage(
    message: ChannelMessage
  ): Promise<FetchedMessage | null> {
    try {
      const fetchedChannel = await client.channels.fetch(message.channel_id);
      return await fetchedChannel.messages.fetch(message.message_id!);
    } catch (error) {
      await this.handleError(message.channel_id, error);
      return null;
    }
  }

  private async handleDeleteTrophy(
    message: ChannelMessage,
    name: string,
    description: string,
    points: string
  ) {
    if (!name) {
      await replyMessage(
        message.channel_id,
        "You need to add trophy name to delete",
        message.message_id!
      );
      return;
    }

    try {
      const result = (await rewardToolService.crudTrophy(
        "del",
        name,
        description,
        +points,
        message.sender_id
      )) as ServiceResult;

      if (
        result?.content &&
        result.content.length > 0 &&
        result.content[0]?.text
      ) {
        await replyMessage(
          message.channel_id,
          result.content[0].text,
          message.message_id!
        );
      } else {
        await this.sendErrorMessage(message.channel_id);
      }
    } catch (error) {
      await this.handleError(message.channel_id, error);
    }
  }

  private async handleUpdateTrophy(
    message: ChannelMessage,
    fetchedMessage: FetchedMessage,
    name: string
  ) {
    if (!name) {
      await replyMessage(
        message.channel_id,
        "Missing trophy name to update",
        message.message_id!
      );
      return;
    }

    try {
      const trophy = await Reward.findOne({ where: { name } });

      if (!trophy) {
        await replyMessage(
          message.channel_id,
          "Trophy not found",
          message.message_id!
        );
        return;
      }

      await fetchedMessage.reply({
        embed: embedTrophy("trophy", "upd", trophy.dataValues),
        components: components("trophy", "upd", trophy.dataValues),
      });
    } catch (error) {
      await this.handleError(message.channel_id, error);
    }
  }

  private async handleListTrophyCommand(message: ChannelMessage) {
    try {
      const result = (await rewardToolService.listTrophy()) as ServiceResult;

      if (
        result?.content &&
        result.content.length > 0 &&
        result.content[0]?.text
      ) {
        const text = formatListTrophy(JSON.parse(result.content[0].text));
        await replyMessage(message.channel_id, text, message.message_id!);
      } else {
        await this.sendErrorMessage(message.channel_id);
      }
    } catch (error) {
      await this.handleError(message.channel_id, error);
    }
  }

  private async sendErrorMessage(channelId: string) {
    await sendMessage(channelId, "Error: Unable to process the returned result.");
  }

  private async handleError(channelId: string, error: unknown) {
    await sendMessage(channelId, "Error: An error occurred while processing the request.");
  }
}
