import { clientMCP } from "../config/connect";
import { ChannelMessage } from "mezon-sdk";
import User from "../models/User";
import dotenv from "dotenv";
import { replyMessage, sendMessage } from "./message.service";
import { client } from "../config/mezon-client";
dotenv.config();

export class SystemService {
  private readonly botId: string;
  private readonly botName: string;
  private readonly welcomeChannelId: string;

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
    try {
      const dataSendToken = {
        sender_id: this.botId,
        sender_name: this.botName,
        receiver_id: message.sender_id,
        amount: +money,
      };

      await client.sendToken(dataSendToken);
      const user = await User.findOne({
        where: { user_id: message.sender_id },
      });

      if (user) {
        user.amount = Number(user.amount) - money;
        await user?.save();
      }

      await replyMessage(
        message?.channel_id!,
        `💸 Successfully withdrew ${money.toLocaleString()} ₫`,
        message?.message_id!
      );
    } catch (error) {
      await replyMessage(
        message?.channel_id!,
        `💸 Failed to withdraw ${money} ₫, please try again`,
        message?.message_id!
      );
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
      let rank = 0;
      for (let i = 0; i < leaderboard.length; i++) {
        const userInfo = leaderboard[i];
        const reward = rewardAmounts[i];
        rank += 1;

        const user = await User.findOne({
          where: { user_id: userInfo.user_id },
        });
        if (user) {
          user.amount = (Number(user.amount) || 0) + reward;
          await user.save();
          await User.increment("amount", {
            by: -Number(reward),
            where: { user_id: this.botId },
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
        } else {
          console.warn(`⚠️ User not found: ${userInfo.user_id}`);
        }
      }
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
