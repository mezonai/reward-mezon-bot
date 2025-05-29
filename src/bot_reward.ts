import dotenv from "dotenv";
import { client } from "./config/mezon-client";
import { connectClient } from "./config/connect";
import { CronJob } from "cron";
import "./models";
import { MezonBotListener } from "./event/mezon.event";
import { showTopDay, showTopMonth, showTopWeek } from "./services/top.service";
import { messageConsumer } from "./services/message-consumer.service";

dotenv.config();

const dailyJob = new CronJob(
  "0 0 8 * * *",
  async function () {
    await messageConsumer.syncMessageCounts();
    await showTopDay();
  },
  null,
  true,
  "Asia/Ho_Chi_Minh"
);

const weeklyJob = new CronJob(
  "0 0 8 * * 1",
  async function () {
    await showTopWeek();
  },
  null,
  true,
  "Asia/Ho_Chi_Minh"
);

const monthlyJob = new CronJob(
  "0 0 8 1 * *",
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
    await messageConsumer.start();
    console.log("✅ Kết nối RabbitMQ thành công");
    const mezonBotListener = new MezonBotListener(client);
    mezonBotListener.listentEvent();
    monthlyJob.start();
    weeklyJob.start();
    dailyJob.start();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
