import { ChannelMessage, MezonClient } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { rewardToolService } from "../services/call_tool.service";
import { replyMessage, sendMessage } from "../services/message.service";
import RoleReward from "../models/Role_rewards";
import { components, embedReward } from "../ultis/form";
import { formatLeaderboard, formatListRole } from "../ultis/constant";
import { client } from "../config/mezon-client";

interface Action {
  action: "new" | "upd" | "del";
}

interface ApiResponse {
  content?: Array<{
    text?: string;
  }>;
}

export class RewardCommand extends CommandMessage {
  async execute(args: string[], message: ChannelMessage, commandName?: string) {
    try {
      const fullArg = args.join(" ");
      if (!fullArg && commandName !== "list" && commandName !== "rank") {
        await replyMessage(
          message.channel_id,
          "Vui lòng cung cấp thông tin hợp lệ.",
          message?.message_id!
        );
        return;
      }

      if (commandName === "list") {
        await this.handleListCommand(message);
        return;
      }

      const [action, roleName, score] = fullArg.split("|").map((s) => s.trim());

      if (commandName === "reward") {
        const fetchedChannel = await client.channels.fetch(message.channel_id);
        const fetchedMessage = await fetchedChannel.messages.fetch(
          message?.message_id!
        );

        switch (action) {
          case "del":
            await this.handleDeleteAction(message, action, roleName, score);
            break;

          case "upd":
            await this.handleUpdateAction(message, fetchedMessage, roleName);
            break;

          case "new":
            await fetchedMessage.reply({
              embed: embedReward("reward", action),
              components: components("reward", action),
            });
            break;

          default:
            await replyMessage(
              message.channel_id,
              "Hành động không hợp lệ. Sử dụng 'new', 'upd', hoặc 'del'.",
              message?.message_id!
            );
        }
      }

      if (commandName === "rank") {
        await this.handleRankCommand(message, fullArg);
        return;
      }
    } catch (error) {
      console.error("Error in reward command:", error);
      await sendMessage(
        message.channel_id,
        "Đã xảy ra lỗi khi xử lý lệnh reward."
      );
    }
  }

  private async handleRankCommand(message: ChannelMessage, fullArg: string) {
    const result = await rewardToolService.rankReward(+fullArg ? +fullArg : 10);

    if (
      result &&
      Array.isArray(result.content) &&
      typeof result.content[0]?.text === "string"
    ) {
      const text = formatLeaderboard(JSON.parse(result.content[0].text));

      await replyMessage(message.channel_id, text, message?.message_id!);
    } else {
      await sendMessage(
        message.channel_id,
        "Lỗi: Không thể xử dý kết quả trả về."
      );
    }
  }

  private async handleListCommand(message: ChannelMessage) {
    const result = (await rewardToolService.listRoleRewards()) as ApiResponse;

    if (result?.content?.[0]?.text) {
      try {
        const data = JSON.parse(result.content[0].text);
        const text = formatListRole(data);
        await replyMessage(message.channel_id, text, message?.message_id!);
      } catch (error) {
        await this.handleApiError(message);
      }
    } else {
      await this.handleApiError(message);
    }
  }

  private async handleDeleteAction(
    message: ChannelMessage,
    action: Action["action"],
    roleName: string,
    score: string
  ) {
    const result = (await rewardToolService.assignRoleOnScore(
      action,
      roleName,
      +score || 0
    )) as ApiResponse;

    if (result?.content?.[0]?.text) {
      await replyMessage(
        message.channel_id,
        result.content[0].text,
        message?.message_id!
      );
    } else {
      await this.handleApiError(message);
    }
  }

  private async handleUpdateAction(
    message: ChannelMessage,
    fetchedMessage: any,
    roleName: string
  ) {
    const reward = await RoleReward.findOne({
      where: { role_name: roleName },
    });

    if (!reward) {
      await replyMessage(
        message.channel_id,
        "Không tìm thấy phần thưởng với tên này.",
        message?.message_id!
      );
      return;
    }

    await fetchedMessage.reply({
      embed: embedReward("reward", "upd", reward?.dataValues),
      components: components("reward", "upd", reward?.dataValues),
    });
  }

  private async handleApiError(message: ChannelMessage) {
    await sendMessage(
      message.channel_id,
      "Lỗi: Không thể xử lý kết quả trả về."
    );
  }
}
