import { ChannelMessage } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { kttkUser, sendToken } from "../ultis/fn";
import { messageService, replyMessage } from "../ultis/message";
import User from "../models/User";
import { rewardToolService } from "../ultis/call-tool";
import { EmbedProps } from "../ultis/form";
import { getRandomColor } from "../ultis/color";
import { client } from "../config/mezon-client";

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

      await replyMessage(
        message.channel_id,
        "Đang tạo ảnh, vui lòng chờ...",
        message?.message_id!
      );

      const result = await rewardToolService.sendMessage(
        message,
        question,
        "create_image"
      );

      const channel = await client.channels.fetch(message?.channel_id);
      const messages = channel.messages.values();
      const context = Array.from(messages).map((msg) => ({
        content: msg.content?.t,
        message_id: msg.id,
      }));

      const messageId = [...context]
        .reverse()
        .find(
          (msg) => msg.content === "```Đang tạo ảnh, vui lòng chờ...```"
        )?.message_id;

      if (!messageId) {
        console.error("Không tìm thấy message 'Đang tạo ảnh...'");
        return;
      }

      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const embed: EmbedProps[] = [
          {
            color: getRandomColor(),
            image: {
              url: result.content[0]?.text,
            },
            timestamp: new Date().toISOString(),
            footer: {
              text: "Powered by Bot-reward",
              icon_url:
                "https://cdn.mezon.vn/1837043892743049216/1840654271217930240/1827994776956309500/857_0246x0w.webp",
            },
          },
        ];

        const results = await messageService.updateEmbed(
          message?.channel_id,
          embed,
          messageId
        );
      }
    }
  }
}
