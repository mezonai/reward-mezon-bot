import { clientMCP } from "../config/connect";
import { client } from "../config/mezon-client";
import { ChannelMessage, EMarkdownType } from "mezon-sdk";
import User from "../models/User";
import dotenv from "dotenv";
import { replyMessage, sendMessage } from "./message.service";
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
    countmessage: number,
    message?: string,
    clan_id?: string
  ) {
    return clientMCP.callTool({
      name: "add-user",
      arguments: {
        user_id,
        username,
        amount,
        countmessage,
        message,
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
        where: { user_id: message.sender_id, clan_id: message.clan_id },
      });

      if (user) {
        user.amount = Number(user.amount) - money;
        await user?.save();
      }

      await replyMessage(
        message?.channel_id!,
        `💸 Rút ${money} ₫ thành công`,
        message?.message_id!
      );
    } catch (error) {
      await replyMessage(
        message?.channel_id!,
        `💸 Rút ${money} ₫ không thành công, vui lòng thử lại`,
        message?.message_id!
      );
    }
  }

  public async checkUserBalance(message: ChannelMessage): Promise<void> {
    try {
      const result = await User.findOne({
        where: { user_id: message.sender_id, clan_id: message.clan_id },
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
          `💸Số dư của bạn là ${result?.amount} ₫`,
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
          where: { user_id: userInfo.user_id, clan_id },
        });
        if (user) {
          user.amount = (Number(user.amount) || 0) + reward;
          await user.save();
          await User.increment("amount", {
            by: -Number(reward),
            where: { user_id: this.botId },
          });

          const message =
            "🎉Chúc mừng " +
            user.username +
            " đã nhận được " +
            reward +
            "₫ " +
            "khi đạt" +
            " top #" +
            rank +
            " Reward " +
            description;

          if (this.welcomeChannelId) {
            await sendMessage(this.welcomeChannelId, message);
          }
        } else {
          console.warn(`⚠️ Không tìm thấy user: ${userInfo.user_id}`);
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
