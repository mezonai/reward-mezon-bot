import { clientMCP } from "../config/connect";
import { client } from "../config/mezon-client";
import { ChannelMessage, EMarkdownType } from "mezon-sdk";
import User from "../models/User";
import dotenv from "dotenv";
import { replyMessage, sendMessage } from "./message";
dotenv.config();

export const addUser = (
  user_id: string,
  username: string,
  amount: number,
  countmessage: number,
  message?: string
) => {
  return clientMCP.callTool({
    name: "add-user",
    arguments: {
      user_id,
      username,
      amount,
      countmessage,
      message,
    },
  });
};

export const sendToken = async (message: ChannelMessage, money: number) => {
  try {
    const dataSendToken = {
      sender_id: process.env.BOT,
      sender_name: process.env.BOT_NAME,
      receiver_id: message.sender_id,
      amount: +money,
    };
    await client.sendToken(dataSendToken);
    const user = await User.findOne({ where: { user_id: message.sender_id } });
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
};

export const kttkUser = async (message: ChannelMessage) => {
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
        `💸Số dư của bạn là ${result?.amount} ₫ `,
        message?.message_id!
      );
    }
  } catch (error) {
    console.error(error);
  }
};

export const giveToken = async (
  leaderboard: any[],
  description: string,
  rewardAmounts: number[]
) => {
  try {
    let rank = 0;
    for (let i = 0; i < leaderboard.length; i++) {
      const userInfo = leaderboard[i];
      const reward = rewardAmounts[i];
      rank += 1;
      const user = await User.findOne({ where: { user_id: userInfo.user_id } });
      if (user) {
        user.amount = (Number(user.amount) || 0) + reward;
        await user.save();
        await User.increment("amount", {
          by: -Number(reward),
          where: { user_id: process.env.BOT },
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

        if (process.env.WELCOME_CHANNEL_ID) {
          await sendMessage(process.env.WELCOME_CHANNEL_ID, message);
        }
      } else {
        console.warn(`⚠️ Không tìm thấy user: ${userInfo.user_id}`);
      }
    }
  } catch (error) {
    console.error(error);
  }
};
