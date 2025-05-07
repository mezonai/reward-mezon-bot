import dotenv from "dotenv";
import { client } from "./config/mezon-client";
import { sendMessage, topWeek } from "./ultis/fn";
import { commands } from "./commands/bot.command";
import { connectClient } from "./config/connect";
import { formatLeaderboard, getStartOfWeek } from "./ultis/constant";
import { TextChannel } from "mezon-sdk/dist/cjs/mezon-client/structures/TextChannel";
import { set } from "date-fns";
import { EMarkdownType } from "mezon-sdk";

dotenv.config();

const checkNewMessages = async (data: any) => {
  if (data.sender_id === process.env.BOT) return;

  if (
    typeof data?.content?.t === "string" &&
    data?.content?.t.startsWith("*")
  ) {
    const args = data?.content?.t.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    console.log("Command:", command);


    const user_id = data?.mentions[0]?.user_id;

    if (!command || !(command in commands)) return;

    try {
      await commands[command as keyof typeof commands].execute(
        data?.channel_id,
        data?.sender_id,
        user_id,
        data?.clan_id,
        data?.message_id,
        args
      );
      return;
    } catch (err) {

      console.error("Error executing command:", err);
      await sendMessage(data.channel_id, "❌ Lỗi cú pháp vui lòng xem lại lệnh *help để thực thi.",data?.message_id, data?.clan_id);
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
      console.log("Data: ", data);
    });

   setInterval(async () => {
      const clans_id = await client.clans.cache.first()?.id; 
      const channel_id  = await client.channels.cache.first()?.id
      const channel = await client.channels.fetch(channel_id as string) ;
      const message_id = await channel.messages.cache.first()?.id ;
      if(channel_id && clans_id && message_id && getStartOfWeek() ) {

        const result = await topWeek();
      
            if (
              result &&
              Array.isArray(result.content) &&
              typeof result.content[0]?.text === "string"
            ) {
              const text = formatLeaderboard(JSON.parse(result.content[0].text));
              await sendMessage(channel_id, text, clans_id, clans_id);
            } else {
              await sendMessage(channel_id, "Lỗi: Không thể xử lý kết quả trả về.",  clans_id, clans_id);
            }
      }
   }, 60*60*24*1000 )
    console.log("✅ Connected to Mezon server");
  } catch (error) {
    process.exit(1);
  }
}

main();
