import dotenv from "dotenv";
import { client } from "./config/mezon-client";
import { sendMessage } from "./ultis/fn";
import { commands } from "./commands/bot.command";
import { connectClient } from "./config/connect";

dotenv.config();

const checkNewMessages = async (data: any) => {
  if (data.sender_id === process.env.BOT) return;

  if (
    typeof data?.content?.t === "string" &&
    data?.content?.t.startsWith("*")
  ) {
    const args = data?.content?.t.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    const user_id = data?.mentions[0]?.user_id;

    if (!command || !(command in commands)) return;

    try {
      await commands[command as keyof typeof commands].execute(
        data?.channel_id,
        data?.sender_id,
        user_id,
        data?.clan_id,
        args
      );

      return;
    } catch (err) {
      console.error(`Error executing command ${command}:`, err);
      await sendMessage(data.channel_id, "❌ Đã xảy ra lỗi khi thực thi lệnh.", data?.clan_id);
      return;
    }
  }


  
};

async function main() {
  try {
    await client.login();
    await connectClient();
    client.onChannelMessage(async (data: any) => {
      if (data?.sender_id === process.env.BOT) return;
      checkNewMessages(data);
    });
    console.log("✅ Connected to Mezon server");
  } catch (error) {
    console.error("Error connecting to Mezon:", error);
    process.exit(1);
  }
}

main();
