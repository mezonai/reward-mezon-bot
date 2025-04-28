import { MezonClient } from "mezon-sdk";
import dotenv from "dotenv";

dotenv.config();

const mezonClient = new MezonClient(process.env.MEZON_TOKEN || "");

mezonClient.once("ready", () => {
  console.log("✅ Mezon bot is ready!");
});

mezonClient.onChannelMessage(async (data) => {
  if (data?.sender_id === process.env.BOT) return;

  if (data?.content?.t === "new_reward") {
    // await handleNewReward(data.channel_id, mezonClient);
  }
});

async function main() {
  try {
    await mezonClient.login();
    console.log("✅ Connected to Mezon server");
  } catch (error) {
    console.error("Error connecting to Mezon:", error);
    process.exit(1);
  }
}

main();
