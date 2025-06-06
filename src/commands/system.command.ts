import { ChannelMessage } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { checkUserBalance, sendToken } from "../services/system.service";
import {
  messageService,
  replyMessage,
  updateMessage,
} from "../services/message.service";
import User from "../models/User";
import { rewardToolService } from "../services/call_tool.service";
import { EmbedProps } from "../ultis/form";
import { getRandomColor } from "../ultis/color";
import { checkAnonymous } from "../ultis/constant";

export class SystemCommand extends CommandMessage {
  async execute(args: string[], message: ChannelMessage, commandName?: string) {
    if (checkAnonymous(message.username!)) {
      await replyMessage(
        message.channel_id,
        "You must mention a valid member or provide a valid user ID or user not found!",
        message?.message_id!
      );
      return;
    }
    if (commandName === "kttk") {
      await checkUserBalance(message);
    }
    if (commandName === "rut") {
      let money = Number(args[0] || 0);

      if (!Number.isInteger(money) || money <= 0) {
        await replyMessage(
          message.channel_id,
          "💸 Số tiền rút không hợp lệ.",
          message.message_id!
        );
        return;
      }
      let user = await User.findOne({
        where: { user_id: message.sender_id, clan_id: message.clan_id },
      });
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
      const result = await rewardToolService.sendMessage(
        message,
        question,
        "ask"
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
      }
    }
    if (commandName === "create_image") {
      const question = args.join(" ");

      const statusMessage = await replyMessage(
        message.channel_id,
        "Đang tạo ảnh, vui lòng chờ...",
        message?.message_id!
      );

      let url = undefined;
      if (message?.references?.[0]?.content) {
        try {
          const contentObj = JSON.parse(message.references[0].content);
          url = contentObj?.embed?.[0]?.image?.url;
        } catch (e) {
          console.error("Invalid JSON in content");
        }
      }

      const result = await rewardToolService.sendMessage(
        message,
        question,
        "create_image",
        url
      );

      if (!statusMessage) {
        return;
      }

      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        if (result.content[0]?.text?.includes("https://")) {
          const embed: EmbedProps[] = [
            {
              color: getRandomColor(),
              title: "Image created",
              image: {
                url: result.content[0]?.text,
                width: "300px",
              },
              timestamp: new Date().toISOString(),
              footer: {
                text: "Powered by Bot-reward",
                icon_url:
                  "https://cdn.mezon.vn/1837043892743049216/1840654271217930240/1827994776956309500/857_0246x0w.webp",
              },
            },
          ];
          await messageService.updateEmbed(
            message?.channel_id,
            embed,
            statusMessage.message_id
          );
        } else {
          await updateMessage(
            result.content[0]?.text,
            message?.channel_id,
            statusMessage.message_id
          );
        }
      }
    }
  }
}
