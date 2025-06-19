import { MezonClient, TokenSentEvent } from "mezon-sdk";
import User from "../models/User";
import { addUser } from "../services/system.service";
import sequelize from "../config/database";
export class TokenEventHandler {
  private user: User | null = null;
  private bot: User | null = null;
  private botId: string;
  private botName: string;
  constructor(private readonly client: MezonClient) {
    this.botId = process.env.BOT!;
    this.botName = process.env.BOT_NAME!;
  }

  public register() {
    this.client.onTokenSend(this.onTokenSend.bind(this));
  }

  public async onTokenSend(data: TokenSentEvent) {
    const transaction = await sequelize.transaction();
    try {
      if (data.amount <= 0) return;
      if (data.receiver_id === process.env.BOT && data.sender_id) {
        let [user, bot] = await Promise.all([
          User.findOne({
            where: { user_id: data.sender_id },
            lock: true,
            transaction,
          }),
          User.findOne({
            where: { user_id: process.env.BOT },
            lock: true,
            transaction,
          }),
        ]);

        this.user = user;
        this.bot = bot;

        if (bot) {
          this.bot!.amount =
            (Number(this.bot!.amount) || 0) + Number(data.amount);
          await this.bot!.save({ transaction });
        } else {
          await addUser(process.env.BOT!, process.env.BOT_NAME!, data.amount);
        }

        if (!user) {
          await addUser(data.sender_id, data.sender_name!, data.amount);
          this.user = await User.findOne({
            where: { user_id: data.sender_id },
            transaction,
          });
          if (!this.user) throw new Error("User creation failed");
        }

        this.user!.amount =
          (Number(this.user!.amount) || 0) + Number(data.amount);
        await this.user!.save({ transaction });

        await transaction.commit();
      }
    } catch (e) {
      try {
        if (this.user && this.bot && data.sender_id) {
          const dataSendToken = {
            sender_id: this.botId,
            sender_name: this.botName,
            receiver_id: data.sender_id,
            amount: +data.amount,
          };
          this.user.amount =
            (Number(this.user.amount) || 0) - Number(data.amount);
          this.bot.amount =
            (Number(this.bot.amount) || 0) - Number(data.amount);

          await Promise.all([
            this.user.save({ transaction }),
            this.bot.save({ transaction }),
            this.client.sendToken(dataSendToken),
          ]);
          await transaction.commit();
        } else {
          await transaction.rollback();
        }
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }
  }
}
