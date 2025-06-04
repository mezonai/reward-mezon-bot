import { ChannelMessage } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { rewardToolService } from "../services/call_tool.service";
import { formatLeaderboard, formatLeaderboardMessage } from "../ultis/constant";
import { replyMessage, sendMessage } from "../services/message.service";
import { format, getMonth, getWeek } from "date-fns";

export class TopCommand extends CommandMessage {
  async execute(args: string[], message: ChannelMessage, commandName?: string) {
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
          `ngày ${day}`
        );

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Lỗi: Không thể xử dý kết quả trả về."
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
          `Tuần ${week}`
        );

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Lỗi: Không thể xử dý kết quả trả về."
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
          `Tháng ${month}`
        );

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Lỗi: Không thể xử dý kết quả trả về."
        );
      }
    }
  }
}
