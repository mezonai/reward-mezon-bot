import { ChannelMessage } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { rewardToolService } from "../ultis/call-tool";
import { replyMessage, sendMessage } from "../ultis/message";
import Reward from "../models/Reward";
import { embedTrophy, components } from "../ultis/form";
import { formatListTrophy, formatListTrophyUser } from "../ultis/constant";
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
        : message?.sender_id!
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
        "Lỗi: Không thể xử dý kết quả trả về."
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
        "Thiếu thông tin hành động (new/upd/del)",
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
          `Hành động không hợp lệ: ${action}. Sử dụng new/upd/del.`,
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
        "Bạn cần thêm tên trophy để xóa",
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
        "Thiếu tên trophy để cập nhật",
        message.message_id!
      );
      return;
    }

    try {
      const trophy = await Reward.findOne({ where: { name } });

      if (!trophy) {
        await replyMessage(
          message.channel_id,
          "Không tìm thấy trophy",
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
    await sendMessage(channelId, "Lỗi: Không thể xử lý kết quả trả về.");
  }

  private async handleError(channelId: string, error: unknown) {
    await sendMessage(channelId, "Lỗi: Đã xảy ra lỗi khi xử lý yêu cầu.");
  }
}
