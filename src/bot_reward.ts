import dotenv from "dotenv";
import { client } from "./config/mezon-client";
import { connectClient } from "./config/connect";
import { CronJob } from "cron";
import "./models";
import { MezonBotListener } from "./event/mezon.event";
import { showTopDay, showTopMonth, showTopWeek } from "./services/top.service";
import { syncMessageCounts } from "./services/memcached.service";
import sequelize from "./config/database";
// import { messageConsumer } from "./services/message-consumer.service";

dotenv.config();

const dailyJob = new CronJob(
  "0 0 8 * * *",
  async function () {
    await syncMessageCounts();
    await showTopDay();
  },
  null,
  true,
  "Asia/Ho_Chi_Minh"
);

const asynCountMessage = new CronJob(
  "0 */5 * * * *",
  async function () {
    syncMessageCounts();
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
    await sequelize.query(`SET TIME ZONE 'Asia/Ho_Chi_Minh';`);
    await sequelize.sync({ alter: true });
    await client.login();
    await connectClient();
    const mezonBotListener = new MezonBotListener(client);
    mezonBotListener.listentEvent();
    monthlyJob.start();
    weeklyJob.start();
    dailyJob.start();
    asynCountMessage.start();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
