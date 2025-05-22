import { ChannelMessage } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { kttkUser, sendToken } from "../ultis/fn";
import { replyMessage } from "../ultis/message";
import User from "../models/User";
import { rewardToolService } from "../ultis/call-tool";

export class SystemCommand extends CommandMessage {
  async execute(args: string[], message: ChannelMessage, commandName?: string) {
    
    if (commandName === "kttk") {
      await kttkUser(message);
    }
    if (commandName === "rut") {
      let money = Number(args[0] || 0);
      let user = await User.findOne({ where: { user_id: message.sender_id } });
      if (!user || user.amount == 0 || money > user.amount) {
        await replyMessage(
          message.channel_id,
          "💸Số dư của bạn không đủ để rút hoặc số tiền rút không hợp lệ ",
          message.message_id!
        );
        return;
      } else {
        money = money == 0 ? user.amount : money;
      }

      await sendToken(message, money);
    }
    if (commandName === "ask") {
      const question = args.join(" ");
      const result = await rewardToolService.sendMessage(message, question);

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
      }
    }
  }
}
