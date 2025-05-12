import dotenv from "dotenv";
import { client } from "./config/mezon-client";
import {
  addUser,
  sendMessage,
  showTopDay,
  showTopMonth,
  showTopWeek,
} from "./ultis/fn";
import { commands } from "./commands/bot.command";
import { connectClient } from "./config/connect";
import { CronJob } from "cron";
import { ChannelMessage, TokenSentEvent } from "mezon-sdk";
import User from "./models/User";
import "./models";

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
    } catch (err: any) {
      await sendMessage(
        data.channel_id,
        "⚠️ Lỗi cú pháp vui lòng xem lại lệnh !help để thực thi.",
        data?.clan_id!
      );
      return;
    }
  }
};

const dailyJob = new CronJob(
  "0 0 6 * * *",
  async function () {
    await showTopDay();
  },
  null,
  true,
  "Asia/Ho_Chi_Minh"
);

const weeklyJob = new CronJob(
  "0 0 6 * * 1",
  async function () {
    await showTopWeek();
  },
  null,
  true,
  "Asia/Ho_Chi_Minh"
);

const monthlyJob = new CronJob(
  "0 0 6 1 * *",
  async function () {
    await showTopMonth();
  },
  null,
  true,
  "Asia/Ho_Chi_Minh"
);

async function main() {
  try {
    await client.login();
    await connectClient();
    client.onChannelMessage(async (data: ChannelMessage) => {
      await addUser(data?.sender_id, data?.username!, 0);
      if (data?.sender_id! === process.env.BOT) return;
      checkNewMessages(data);
    });

    client.onTokenSend(async (data: TokenSentEvent) => {
      if (data.amount <= 0) return;
      if (data.receiver_id === process.env.BOT && data.sender_id) {
        try {
          let user = await User.findOne({ where: { user_id: data.sender_id } });

          if (!user) {
            await addUser(data.sender_id, data.sender_name!, data.amount);
            user = await User.findOne({ where: { user_id: data.sender_id } });
            if (!user) throw new Error("User creation failed");
          }
          user.amount = (Number(user.amount) || 0) + Number(data.amount);
          await user.save();
        } catch (e) {
          console.error("Error handling TokenSentEvent:", e);
        }
      }
    });
    client.onAddClanUser(async (data) => {
      await addUser(data?.user.user_id, data?.user.username!, 0);
    });
    monthlyJob.start();
    weeklyJob.start();
    dailyJob.start();
  } catch (error) {
    process.exit(1);
  }
}

main();
