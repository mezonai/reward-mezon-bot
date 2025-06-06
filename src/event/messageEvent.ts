import { ChannelMessage, MezonClient } from "mezon-sdk";
import { commands } from "../commands/index";
import { imageCreationRequest } from "../ultis/constant";
import { addUser } from "../services/system.service";
import { publishMessage } from "../services/memcached.service";
import { sendMessage } from "../services/message.service";
export class MessageEventHandler {
  constructor(private readonly client: MezonClient) {}

  public register() {
    this.client.onChannelMessage(this.onChannelMessage.bind(this));
  }

  public async onChannelMessage(data: ChannelMessage) {
    await addUser(
      data.sender_id,
      data.username!,
      0,
      0,
      data?.content?.t!,
      data.clan_id!
    );
    await publishMessage(data);
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
        await commands["ask"].execute(args, data, "create_image");
        return;
      } else {
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

    console.log("data", data);
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
