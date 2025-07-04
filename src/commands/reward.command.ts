import { ChannelMessage, MezonClient } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { rewardToolService } from "../services/call_tool.service";
import { replyMessage, sendMessage } from "../services/message.service";
import RoleReward from "../models/Role_rewards";
import { components, embedReward } from "../ultis/form";
import {
  checkAnonymous,
  formatLeaderboard,
  formatListRole,
} from "../ultis/constant";
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
      if (checkAnonymous(message.username!)) {
        await replyMessage(
          message.channel_id,
          "You must mention a valid member or provide a valid user ID or user not found!",
          message?.message_id!
        );
        return;
      }
      const fullArg = args.join(" ");
      if (!fullArg && commandName !== "list" && commandName !== "rank") {
        await replyMessage(
          message.channel_id,
          "Please provide valid information.",
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

        if (message.sender_id !== "1840678415796015104") return
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
              "Invalid action. Use 'new', 'upd', or 'del'.",
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
        "An error occurred while processing the reward command."
      );
    }
  }

  private async handleRankCommand(message: ChannelMessage, fullArg: string) {
    const result = await rewardToolService.rankReward(
      +fullArg ? +fullArg : 10,
      message.clan_id!
    );

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
        "Error: Unable to process the returned result."
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
        "Reward with this name not found.",
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
      "Error: Unable to process the returned result."
    );
  }
}
