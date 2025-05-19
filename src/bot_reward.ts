import dotenv from "dotenv";
import { client } from "./config/mezon-client";
import { connectClient } from "./config/connect";
import { CronJob } from "cron";
import "./models";
import { MezonBotListener } from "./event/mezon.event";
import { showTopDay, showTopMonth, showTopWeek } from "./ultis/top";

dotenv.config();

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
    const botListener = new MezonBotListener(client);
    botListener.register();
    monthlyJob.start();
    weeklyJob.start();
    dailyJob.start();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
