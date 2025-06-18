import { ChannelMessage, MezonClient } from "mezon-sdk";
import { commands } from "../commands/index";
import { imageCreationRequest } from "../ultis/constant";
import { addUser } from "../services/system.service";
import { publishMessage, syncMessageCounts } from "../services/memcached.service";
import { sendMessage } from "../services/message.service";
export class MessageEventHandler {
  constructor(private readonly client: MezonClient) {}

  public register() {
    this.client.onChannelMessage(this.onChannelMessage.bind(this));
  }

  public async onChannelMessage(data: ChannelMessage) {
    await addUser(data.sender_id, data.username!, 0, data.clan_id!);
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

  }

  private async handleExclamationCommand(data: ChannelMessage, text: string) {
    const args = text.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    if (!command) return;
    
    if (command in commands) {
      try {
        await commands[command as keyof typeof commands].execute(
          args,
          data,
          command
        );
      } catch (error) {
        console.error("error", error);
        await sendMessage(
          data.channel_id,
          "⚠️ Error, please check the command `!help`."
        );
      }
    } else {
      const suggestion = this.findSimilarCommand(command);
      if (suggestion) {
        await sendMessage(
          data.channel_id,
          `⚠️ Command \`!${command}\` not found. Did you mean \`!${suggestion}\`?`
        );
      } else {
        await sendMessage(
          data.channel_id,
          `⚠️ Command \`!${command}\` not found. Type \`!help\` to see available commands.`
        );
      }
    }
  }


  private findSimilarCommand(input: string): string | null {
    const availableCommands = Object.keys(commands);
    let bestMatch: string | null = null;
    let bestDistance = Infinity;
    
    for (const cmd of availableCommands) {
      const distance = this.levenshteinDistance(input, cmd);

      if (distance < bestDistance && distance <= Math.max(2, Math.floor(cmd.length / 2))) {
        bestMatch = cmd;
        bestDistance = distance;
      }
    }
    
    return bestMatch;
  }


  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

 
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     
          matrix[i][j - 1] + 1,      
          matrix[i - 1][j - 1] + cost 
        );
      }
    }

    return matrix[b.length][a.length];
  }
}
