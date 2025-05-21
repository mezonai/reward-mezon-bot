import dotenv from "dotenv";
import { MezonClient } from "mezon-sdk";
import { TextChannel } from "mezon-sdk/dist/cjs/mezon-client/structures/TextChannel";

dotenv.config();

if (!process.env.MEZON_TOKEN) {
  throw new Error("MEZON_TOKEN is not defined in .env file");
}

const client = new MezonClient(process.env.MEZON_TOKEN);

client.once("ready", () => {
  console.log("✅ Mezon bot is ready!");
});

export { client };
