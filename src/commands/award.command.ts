import { ChannelMessage } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { rewardToolService } from "../services/call_tool.service";
import { replyMessage, sendMessage } from "../services/message.service";
import { checkAnonymous } from "../ultis/constant";

export class AwardCommand extends CommandMessage {
  async execute(args: string[], message: ChannelMessage, commandName?: string) {
    if (checkAnonymous(message.username!)) {
      await replyMessage(
        message.channel_id,
        "You must mention a valid member or provide a valid user ID or user not found!",
        message?.message_id!
      );
      return;
    }
    const fullArg = args.join(" ");
    const [name, rewardName] = fullArg.split("|").map((s) => s.trim());
    const userName = name.replace("@", "").trim();
    const result = await rewardToolService.awardTrophy(
      message?.mentions?.[0]?.user_id!,
      rewardName,
      userName,
      message.sender_id,
      message.clan_id!
    );
    if (
      result &&
      Array.isArray(result.content) &&
      typeof result.content[0]?.text === "string"
    ) {
      await replyMessage(
        message.channel_id,
        result.content[0].text,
        message?.message_id!
      );
    } else {
      await sendMessage(
        message.channel_id,
        "Lỗi: Không thể xử dý kết quả trả về."
      );
    }
  }
}
