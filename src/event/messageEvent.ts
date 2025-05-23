import { ChannelMessage, MezonClient } from "mezon-sdk";
import { addUser } from "../ultis/fn";
import { sendMessage } from "../ultis/message";
import { commands } from "../commands/index";
import { client } from "../config/mezon-client";
import { imageCreationRequest } from "../ultis/constant";

export class MessageEventHandler {
  constructor(private readonly client: MezonClient) {}

  public register() {
    client.onChannelMessage(this.onChannelMessage.bind(this));
  }

  public async onChannelMessage(data: ChannelMessage) {
    await addUser(data.sender_id, data.username!, 0, 0, data?.content?.t!);
    if (
      (Array.isArray(data?.mentions) &&
        data?.mentions.length > 0 &&
        data.mentions[0].user_id === process.env.BOT) ||
      (Array.isArray(data?.references) &&
        data.references.length > 0 &&
        data.references[0]?.message_sender_id === process.env.BOT)
    ) {
      let args;
      const rawText = data.content.t || "";
      args = rawText.includes("@bot-reward")
        ? rawText.replace("@bot-reward", "").trim().split(/\s+/)
        : rawText.split(/\s+/);

      if (imageCreationRequest(data?.content?.t!)) {
        console.log("1");
        await commands["ask"].execute(args, data, "create_image");
        return;
      } else {
        console.log("2");
        await commands["ask"].execute(args, data, "ask");
        return;
      }
    }
    if (
      typeof data?.content?.t === "string" &&
      data.content.t.startsWith("!")
    ) {
      const text = data.content.t;
      await this.handleExclamationCommand(data, text);
    }
    if (data.sender_id === process.env.BOT) return;
  }

  private async handleExclamationCommand(data: ChannelMessage, text: string) {
    const args = text.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    if (!command || !(command in commands)) return;
    try {
      await commands[command as keyof typeof commands].execute(
        args,
        data,
        command
      );
    } catch (error) {
      await sendMessage(
        data.channel_id,
        "⚠️ Lỗi cú pháp, vui lòng xem lại lệnh `!help`."
      );
    }
  }
}
