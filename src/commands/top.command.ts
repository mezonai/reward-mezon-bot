import { ChannelMessage } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { rewardToolService } from "../services/call_tool.service";
import {
  checkAnonymous,
  formatLeaderboard,
  formatLeaderboardMessage,
} from "../ultis/constant";
import { replyMessage, sendMessage } from "../services/message.service";
import { format, getMonth, getWeek } from "date-fns";

export class TopCommand extends CommandMessage {
  async execute(args: string[], message: ChannelMessage, commandName?: string) {
    if (checkAnonymous(message.username!)) {
      await replyMessage(
        message.channel_id,
        "You must mention a valid member or provide a valid user ID or user not found!",
        message?.message_id!
      );
      return;
    }
    if (commandName === "top") {
      const result = await rewardToolService.topDay(message.clan_id!);
      const day = format(new Date(), "yyyy-MM-dd");
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboardMessage(
          JSON.parse(result.content[0].text),
          `day ${day}`
        );

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Error: Unable to process the returned result."
        );
      }
    }
    if (commandName === "top_week") {
      const result = await rewardToolService.topWeek(message.clan_id!);
      const week = getWeek(new Date());
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(
          JSON.parse(result.content[0].text),
          `Week ${week}`
        );

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Error: Unable to process the returned result."
        );
      }
    }
    if (commandName === "top_month") {
      const result = await rewardToolService.topMonth(message.clan_id!);
      const month = getMonth(new Date()) + 1;
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(
          JSON.parse(result.content[0].text),
          `Month ${month}`
        );

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Error: Unable to process the returned result."
        );
      }
    }
  }
}
