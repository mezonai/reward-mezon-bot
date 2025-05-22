import { MezonClient, TokenSentEvent } from "mezon-sdk";
import { addUser } from "../ultis/fn";
import User from "../models/User";

export class TokenEventHandler {
  constructor(private readonly client: MezonClient) {}

  public register() {
    this.client.onTokenSend(this.onTokenSend.bind(this));
  }

  public async onTokenSend(data: TokenSentEvent) {
    if (data.amount <= 0) return;
    if (data.receiver_id === process.env.BOT && data.sender_id) {
      try {
        let [user, bot] = await Promise.all([
          User.findOne({ where: { user_id: data.sender_id } }),
          User.findOne({ where: { user_id: process.env.BOT } }),
        ]);

        if (bot) {
          bot.amount = (Number(bot.amount) || 0) + Number(data.amount);
          await bot.save();
        } else {
          await addUser(process.env.BOT, process.env.BOT_NAME!, data.amount, 0);
        }

        if (!user) {
          await addUser(data.sender_id, data.sender_name!, data.amount, 0);
          user = await User.findOne({ where: { user_id: data.sender_id } });
          if (!user) throw new Error("User creation failed");
        }

        user.amount = (Number(user.amount) || 0) + Number(data.amount);
        await user.save();
      } catch (e) {
        console.error("❌ TokenSentEvent Error:", e);
      }
    }
  }
}
