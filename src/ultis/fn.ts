import { clientMCP } from "../config/connect";
import { client } from "../config/mezon-client";
import { ChannelMessage, EMarkdownType } from "mezon-sdk";
import { formatLeaderboard, formatMessageReply } from "./constant";
import { getMonth, getWeek, subDays } from "date-fns";
import User from "../models/User";

export const sendMessage = async (
  channel: string,
  message: string | object,
  server: string
) => {
  try {
    await clientMCP.callTool({
      name: "send-message",
      arguments: {
        server: server,
        channel,
        message,
      },
    });
  } catch (err) {
    console.error("Error sending message:", err);
  }
};

export const crudTrophy = async (
  action: "del" | "upd" | "new",
  name: string,
  description: string,
  points: number,
  icon?: string,
  createdBy?: string
) => {
  return await clientMCP.callTool({
    name: "crud-trophy",
    arguments: {
      name,
      description,
      points: points || 0,
      icon,
      createdBy,
      action,
    },
  });
};

export const awardTrophy = async (
  userId: string,
  rewardName: string,
  userName: string,
  sender_id: string
) => {
  return await clientMCP.callTool({
    name: "award-user",
    arguments: {
      userId,
      rewardName,
      userName,
      sender_id,
    },
  });
};

export const rankReward = async (limit: number = 5) => {
  return await clientMCP.callTool({
    name: "rank",
    arguments: {
      limit,
    },
  });
};

export const trophyUser = async (userId: string) => {
  return await clientMCP.callTool({
    name: "get-user-rewards",
    arguments: {
      userId,
    },
  });
};

export const listRoleRewards = async () => {
  return await clientMCP.callTool({
    name: "list-role-rewards",
  });
};

export const assignRoleOnScore = async (
  action: "new" | "upd" | "del",
  roleName: string,
  point_threshold: number
) => {
  return await clientMCP.callTool({
    name: "assign-role-on-score",
    arguments: {
      role_name: roleName,
      point_threshold,
      action,
    },
  });
};

export const listTrophy = async () => {
  return await clientMCP.callTool({
    name: "list-trophy",
  });
};
export const topWeek = async () => {
  return await clientMCP.callTool({
    name: "top-week",
    arguments: {
      date: new Date().toISOString().split("T")[0],
    },
  });
};

export const topMonth = async () => {
  return await clientMCP.callTool({
    name: "top-month",
    arguments: {
      date: new Date().toISOString().split("T")[0],
    },
  });
};

export const replyMessage = async (
  channelId: string,
  message: string,
  message_id: string
) => {
  const fetchedChannel = await client.channels.fetch(channelId);
  const fetchedMessage = await fetchedChannel.messages.fetch(message_id);
  const repyMessage = formatMessageReply(message);
  await fetchedMessage.reply({
    t: repyMessage,
    mk: [
      {
        type: EMarkdownType.TRIPLE,
        s: 0,
        e: repyMessage.length,
      },
    ],
  });
};

export const showTopWeek = async () => {
  const listClan = [...client.clans.values()];
  const result = await topWeek();
  const week = getWeek(subDays(new Date(), 1));
  const rewardAmounts = [15000, 10000, 5000];
  let arrayUser: any[] = [];
  for (const clan of listClan) {
    const listchannel = [...clan.channels.values()];
    for (const channel of listchannel) {
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(
          JSON.parse(result.content[0].text),
          `Tuần ${week}`
        );
        arrayUser = JSON.parse(result.content[0].text);

        const message = formatMessageReply(text);
        await sendMessage(
          channel?.id!,
          {
            t: message,
            mk: [
              {
                type: EMarkdownType.TRIPLE,
                s: 0,
                e: message.length,
              },
            ],
          },
          clan.id
        );
      } else {
        await sendMessage(
          channel?.id!,
          " ⚠️ Lỗi: Không thể xử lý kết quả trả về.",
          clan.id
        );
      }
    }
  }
  await giveToken(arrayUser, listClan, "Tuần", rewardAmounts);
};

export const showTopMonth = async () => {
  const listClan = [...client.clans.values()];
  const result = await topMonth();
  const month = getMonth(subDays(new Date(), 1)) + 1;
  let arrayUser: any[] = [];
  const rewardAmounts = [50000, 30000, 15000];

  for (const clan of listClan) {
    const listchannel = [...clan.channels.values()];
    for (const channel of listchannel) {
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(
          JSON.parse(result.content[0].text),
          `Tháng ${month}`
        );
        arrayUser = JSON.parse(result.content[0].text);
        const message = formatMessageReply(text);
        await sendMessage(
          channel?.id!,
          {
            t: message,
            mk: [
              {
                type: EMarkdownType.TRIPLE,
                s: 0,
                e: message.length,
              },
            ],
          },
          clan.id
        );
      } else {
        await sendMessage(
          channel?.id!,
          " ⚠️ Lỗi: Không thể xử lý kết quả trả về.",
          clan.id
        );
      }
    }
  }
  await giveToken(arrayUser, listClan, "Tháng", rewardAmounts);
};

export const addUser = (user_id: string, username: string, amount: number) => {
  return clientMCP.callTool({
    name: "add-user",
    arguments: {
      user_id,
      username,
      amount,
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
      message.channel_id,
      `💸 Rút ${money} ₫ thành công`,
      message.message_id!
    );
  } catch (error) {
    console.log(error);
  }
};

export const kttkUser = async (message: ChannelMessage) => {
  try {
    const result = await User.findOne({
      where: { user_id: message.sender_id },
    });
    if (!result) {
      await replyMessage(
        message.channel_id!,
        `User not found`,
        message?.message_id!
      );
    }
    await replyMessage(
      message.channel_id!,
      `💸Số dư của bạn là ${result?.amount} ₫ `,
      message?.message_id!
    );
  } catch (error) {
    console.error(error);
  }
};

export const giveToken = async (
  leaderboard: any[],
  listClan: any[],
  description: string,
  rewardAmounts: any[]
) => {
  let rank = 0;
  for (let i = 0; i < leaderboard.length; i++) {
    const userInfo = leaderboard[i];
    const reward = rewardAmounts[i];
    rank += 1;
    const user = await User.findOne({ where: { user_id: userInfo.user_id } });
    if (user) {
      user.amount = (Number(user.amount) || 0) + reward;
      await user.save();
      const message =
        "```" +
        "🎉Chúc mừng " +
        user.username +
        " đã nhận được " +
        reward +
        "₫ " +
        "khi đạt" +
        " top #" +
        rank +
        " Reward " +
        description +
        "```";

      for (const clan of listClan) {
        const listchannel = [...clan.channels.values()];
        for (const channel of listchannel) {
          await sendMessage(
            channel?.id!,
            {
              t: message,
              mk: [
                {
                  type: EMarkdownType.TRIPLE,
                  s: 0,
                  e: message.length,
                },
              ],
            },
            clan.id
          );
        }
      }
    } else {
      console.warn(`⚠️ Không tìm thấy user: ${userInfo.user_id}`);
    }
  }
};
