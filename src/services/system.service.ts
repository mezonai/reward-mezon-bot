import { clientMCP } from "../config/connect";
import { ChannelMessage } from "mezon-sdk";
import User from "../models/User";
import Transaction, { TransactionType } from "../models/Transaction";
import dotenv from "dotenv";
import { replyMessage, sendMessage } from "./message.service";
import { client } from "../config/mezon-client";
import sequelize from "../config/database";
dotenv.config();

export class SystemService {
  private readonly botId: string;
  private readonly botName: string;
  private readonly welcomeChannelId: string;
  private processingUsers: Map<string, boolean> = new Map();

  constructor() {
    this.botId = process.env.BOT || "";
    this.botName = process.env.BOT_NAME || "";
    this.welcomeChannelId = process.env.WELCOME_CHANNEL_ID || "";
  }

  public async addUser(
    user_id: string,
    username: string,
    amount: number,
    clan_id?: string
  ) {
    return clientMCP.callTool({
      name: "add-user",
      arguments: {
        user_id,
        username,
        amount,
        clan_id,
      },
    });
  }

  public async sendToken(
    message: ChannelMessage,
    money: number
  ): Promise<void> {
    const userId = message.sender_id;

    if (this.processingUsers.get(userId)) {
      await replyMessage(
        message?.channel_id!,
        "⏳ You have a withdrawal request currently being processed. Please wait until it is completed before submitting a new request.",
        message?.message_id!
      );
      return;
    }

    this.processingUsers.set(userId, true);

    let pendingTx: Transaction | null = null;
    try {
      const dataSendToken = {
        sender_id: this.botId,
        sender_name: this.botName,
        receiver_id: userId,
        amount: +money,
      };

      const createTx = await sequelize.transaction();
      try {
        pendingTx = await Transaction.create(
          {
            amount: money,
            transaction_type: TransactionType.WITHDRAWAL,
            sender_id: this.botId,
            receiver_id: userId,
            description: `Withdrawal requested by ${
              message.username || userId
            }`,
            status: false,
          },
          { transaction: createTx }
        );
        await createTx.commit();
      } catch (e) {
        await createTx.rollback();
        throw e;
      }

      await client.sendToken(dataSendToken);

      const updateTx = await sequelize.transaction();
      try {
        const user = await User.findOne({
          where: { user_id: userId },
          lock: true,
          transaction: updateTx,
        });
        if (user) {
          user.amount = (Number(user.amount) || 0) - Number(money);
          await user.save({ transaction: updateTx });
        }

        const bot = await User.findOne({
          where: { user_id: this.botId },
          lock: true,
          transaction: updateTx,
        });
        if (bot) {
          bot.amount = (Number(bot.amount) || 0) - Number(money);
          await bot.save({ transaction: updateTx });
        }

        if (pendingTx) {
          pendingTx.status = true;
          await pendingTx.save({ transaction: updateTx });
        }

        await updateTx.commit();

        await replyMessage(
          message?.channel_id!,
          `💸 Successfully withdrew ${money.toLocaleString()} ₫`,
          message?.message_id!
        );
      } catch (e) {
        await updateTx.rollback();
        throw e;
      }
    } catch (error) {
      await replyMessage(
        message?.channel_id!,
        `💸 Failed to withdraw ${money} ₫, please try again`,
        message?.message_id!
      );
    } finally {
      this.processingUsers.delete(userId);
    }
  }

  public async getUserRewards(userId: string, clan_id: string) {
    return clientMCP.callTool({
      name: "get-user-rewards",
      arguments: {
        userId,
        clan_id,
      },
    });
  }

  public async topDay(clan_id: string) {
    return clientMCP.callTool({
      name: "top-day",
      arguments: {
        clan_id,
      },
    });
  }

  public async topWeek(clan_id: string) {
    return clientMCP.callTool({
      name: "top-week",
      arguments: {
        clan_id,
      },
    });
  }

  public async topMonth(clan_id: string) {
    return clientMCP.callTool({
      name: "top-month",
      arguments: {
        clan_id,
      },
    });
  }

  public async checkUserBalance(message: ChannelMessage): Promise<void> {
    try {
      const result = await User.findOne({
        where: { user_id: message.sender_id },
      });

      if (!result) {
        await replyMessage(
          message?.channel_id!,
          `User not found`,
          message?.message_id!
        );
      } else {
        await replyMessage(
          message?.channel_id!,
          `💸 Your balance is ${result?.amount} ₫`,
          message?.message_id!
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  public async giveToken(
    leaderboard: any[],
    description: string,
    rewardAmounts: number[],
    clan_id: string
  ): Promise<void> {
    try {
      const transaction = await sequelize.transaction();

      let rank = 0;
      for (let i = 0; i < leaderboard.length; ++i) {
        const userInfo = leaderboard[i];
        const reward = rewardAmounts[i];
        rank += 1;

        const user = await User.findOne({
          where: { user_id: userInfo.user_id },
        });
        if (user) {
          try {
            user.amount = (Number(user.amount) || 0) + reward;
            await user.save({ transaction });

            await User.increment("amount", {
              by: -Number(reward),
              where: { user_id: this.botId },
              transaction,
            });

            const message =
              "🎉 Congratulations " +
              user.username +
              " has received " +
              reward.toLocaleString() +
              "₫ " +
              "for reaching" +
              " top #" +
              rank +
              " Reward " +
              description;

            if (clan_id) {
              await sendMessage(clan_id, message);
            }
          } catch (error) {
            await transaction.rollback();
            console.error(`Error giving token to user ${user.user_id}:`, error);
          }
        } else {
          console.warn(`⚠️ User not found: ${userInfo.user_id}`);
        }
      }
      await transaction.commit();
    } catch (error) {
      console.error(error);
    }
  }
}

export const systemService = new SystemService();

export const addUser = systemService.addUser.bind(systemService);
export const sendToken = systemService.sendToken.bind(systemService);
export const checkUserBalance =
  systemService.checkUserBalance.bind(systemService);
export const giveToken = systemService.giveToken.bind(systemService);
