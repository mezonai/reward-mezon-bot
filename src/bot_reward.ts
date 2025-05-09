import dotenv from "dotenv";
import { client } from "./config/mezon-client";
import { sendMessage, showTopMonth, showTopWeek } from "./ultis/fn";
import { commands } from "./commands/bot.command";
import { connectClient } from "./config/connect";
import { CronJob } from "cron";
import { TextChannel } from "mezon-sdk/dist/cjs/mezon-client/structures/TextChannel";
import { ChannelMessage } from "mezon-sdk";

dotenv.config();

const checkNewMessages = async (data: ChannelMessage) => {
  if (data?.sender_id! === process.env.BOT) return;

  if (
    typeof data?.content?.t === "string" &&
    data?.content?.t.startsWith("!")
  ) {
    const args = data?.content?.t.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();


    const user_id = data?.mentions?.[0]?.user_id ?? null;

    if (!command || !(command in commands)) return;

    try {
      await commands[command as keyof typeof commands].execute(
        data,
        user_id!,
        args
      );
      return;
    } catch (err) {

      await sendMessage(data.channel_id, "⚠️ Lỗi cú pháp vui lòng xem lại lệnh *help để thực thi.", data?.clan_id!);
      return;
    }
  }
};



const weeklyJob = new CronJob(
  '0 0 6 * * 1',
  async function () {
    await showTopWeek();
  },
  null,
  true,
  'Asia/Ho_Chi_Minh'
);

const monthlyJob = new CronJob(
  '0 0 6 1 * *',
  async function () {
    await showTopMonth();
  },
  null,
  true,
  'Asia/Ho_Chi_Minh'
);

async function main() {
  try {
    await client.login();
    await connectClient();
    client.onChannelMessage(async (data: ChannelMessage) => {
      if (data?.sender_id! === process.env.BOT) return;
      checkNewMessages(data);
    });
    monthlyJob.start();
    weeklyJob.start();
  } catch (error) {
    process.exit(1);
  }
}

main();
