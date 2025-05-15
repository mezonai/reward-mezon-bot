import { clientMCP } from "../config/connect";
import { client } from "../config/mezon-client";
import { ChannelMessage, EMarkdownType } from "mezon-sdk";
import { ERROR_TOKEN, formatLeaderboard, formatMessageReply } from "./constant";
import { format, getMonth, getWeek, subDays } from "date-fns";
import User from "../models/User";
import dotenv from "dotenv";
import { Op } from "sequelize";
import { Reward } from "../models";
dotenv.config();

const LOG_CHANNEL_ID = "1840681202449649664";
const LOG_CLAN_ID = "1840681202428678144";

export const sendLog = async (logMessage: string) => {
  try {
    await clientMCP.callTool({
      name: "send-message",
      arguments: {
        server: LOG_CLAN_ID,
        channel: LOG_CHANNEL_ID,
        message: {
          t: `[LOG] ${logMessage}`,
          mk: [
            {
              type: EMarkdownType.TRIPLE,
              s: 0,
              e: logMessage.length + 6,
            },
          ],
        },
      },
    });
    console.log(`Log sent: ${logMessage}`);
  } catch (err) {
    console.error("Error sending log:", err);
  }
};

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

    if (channel === LOG_CHANNEL_ID && server === LOG_CLAN_ID) {
      return;
    }

    const messageContent =
      typeof message === "string"
        ? message
        : JSON.stringify(message).substring(0, 100) + "...";
    await sendLog(
      `Message sent to channel ${channel} on server ${server}: ${messageContent}`
    );
  } catch (err) {
    console.error("Error sending message:", err);
    await sendLog(`Error sending message to channel ${channel}: ${err}`);
  }
};

export const crudTrophy = async (
  action: "del" | "upd" | "new",
  name: string,
  description: string,
  points: number,
  createdBy?: string
) => {
  try {
    const result = await clientMCP.callTool({
      name: "crud-trophy",
      arguments: {
        name,
        description,
        points: points || 0,
        createdBy,
        action,
      },
    });

    await sendLog(`Trophy ${action} performed: ${name}, Points: ${points}`);
    return result;
  } catch (err) {
    await sendLog(`Error in crudTrophy (${action}): ${err}`);
    throw err;
  }
};

export const awardTrophy = async (
  userId: string,
  rewardName: string,
  userName: string,
  sender_id: string
) => {
  try {
    const result = await clientMCP.callTool({
      name: "award-user",
      arguments: {
        userId,
        rewardName,
        userName,
        sender_id,
      },
    });

    await sendLog(
      `Trophy awarded to user ${userName} (${userId}): ${rewardName}`
    );
    return result;
  } catch (err) {
    await sendLog(`Error awarding trophy to ${userName}: ${err}`);
    throw err;
  }
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

export const topDay = async () => {
  return await clientMCP.callTool({
    name: "top-day",
    arguments: {
      date: new Date().toISOString().split("T")[0],
    },
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
  try {
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

    await sendLog(
      `Reply sent to message ${message_id} in channel ${channelId}: ${message}`
    );
  } catch (err) {
    await sendLog(`Error replying to message ${message_id}: ${err}`);
    console.error(err);
  }
};

export const showTopGeneric = async (
  message: string,
  arrayUser: string[],
  rewardAmounts: number[],
  type: string
) => {
  try {
    const listClan = [...client.clans.values()];
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
    await sendLog(`Showed top ${type} leaderboard to all channels`);
    await giveToken(arrayUser, listClan, type, rewardAmounts);
  } catch (error) {
    await sendLog(`Error showing top ${type}: ${error}`);
    console.log(error);
  }
};

export const showTopDay = async () => {
  try {
    console.log("RUNN");
    await sendLog("Starting showTopDay function");
    let message;
    const points = 10000;
    const trophy = "Most active member";
    const subdate = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const topUsers = await User.findAll({
      where: {
        user_id: { [Op.ne]: process.env.BOT as string },
      },
      order: [["countmessage", "DESC"]],
      limit: 10,
    });
    let trophies = await Reward.findOne({ where: { name: trophy } });
    if (!trophies) {
      trophies = await Reward.create({
        name: trophy,
        description: "thành viên tích cực",
        points: points,
        createdBy: process.env.BOT,
      });
      await sendLog(`Created new trophy: ${trophy}`);
    }
    const plainUsers = topUsers.map((user) => user.toJSON());
    const randomNumber = Math.floor(Math.random() * topUsers.length);
    const user = plainUsers[randomNumber];
    if (user && process.env.BOT && trophies.dataValues.name === trophy) {
      await sendLog(`Selected user for trophy: ${user.username}`);
      const award = await awardTrophy(
        user.user_id,
        trophy,
        user.username,
        process.env.BOT
      );
      if (
        Array.isArray(award.content) &&
        typeof award.content[0]?.text === "string"
      ) {
        if (award.content[0]?.text === ERROR_TOKEN) {
          message = formatMessageReply(award.content[0]?.text);
          await sendLog(`Trophy award failed: ${ERROR_TOKEN}`);
        } else {
          message =
            "```" +
            award.content[0]?.text +
            " là người may mắn nằm trong top 10 thành viên tích cực trong ngày " +
            subdate +
            "```";
          await sendLog(
            `Trophy awarded to ${award.content[0]?.text} for day ${subdate}`
          );
        }
        const listClan = [...client.clans.values()];
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
        await User.update({ countmessage: 0 }, { where: {} });
        await sendLog(`Reset countmessage for all users`);
      }

      return;
    }
  } catch (error) {
    await sendLog(`Error in showTopDay: ${error}`);
    console.error(error);
  }
};

export const showTopWeek = async () => {
  try {
    await sendLog("Starting showTopWeek function");
    const result = await topWeek();
    const week = getWeek(subDays(new Date(), 1));
    const rewardAmounts = [15000, 10000, 5000];
    let arrayUser: string[] = [];
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
      await sendLog(
        `Week ${week} leaderboard generated with ${arrayUser.length} users`
      );
      showTopGeneric(message, arrayUser, rewardAmounts, `Tuần ${week}`);
    }
  } catch (error) {
    await sendLog(`Error in showTopWeek: ${error}`);
    console.error(error);
  }
};

export const showTopMonth = async () => {
  try {
    await sendLog("Starting showTopMonth function");
    const result = await topMonth();
    const month = getMonth(subDays(new Date(), 1)) + 1;
    let arrayUser: string[] = [];
    const rewardAmounts: number[] = [50000, 30000, 15000];
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
      await sendLog(
        `Month ${month} leaderboard generated with ${arrayUser.length} users`
      );
      showTopGeneric(message, arrayUser, rewardAmounts, `Tháng ${month}`);
    }
  } catch (error) {
    await sendLog(`Error in showTopMonth: ${error}`);
    console.error(error);
  }
};

export const addUser = (
  user_id: string,
  username: string,
  amount: number,
  countmessage: number
) => {
  return clientMCP.callTool({
    name: "add-user",
    arguments: {
      user_id,
      username,
      amount,
      countmessage,
    },
  });
};

export const sendToken = async (message: ChannelMessage, money: number) => {
  try {
    await sendLog(
      `Attempting to send ${money} tokens to user ${message.sender_id}`
    );
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
    await sendLog(
      `Successfully sent ${money} tokens to user ${message.sender_id}`
    );
  } catch (error) {
    await sendLog(`Error sending tokens to ${message.sender_id}: ${error}`);
    console.log(error);
  }
};

export const kttkUser = async (message: ChannelMessage) => {
  try {
    await sendLog(`Checking balance for user ${message.sender_id}`);
    const result = await User.findOne({
      where: { user_id: message.sender_id },
    });
    if (!result) {
      await replyMessage(
        message.channel_id!,
        `User not found`,
        message?.message_id!
      );
      await sendLog(`User ${message.sender_id} not found for balance check`);
    } else {
      await replyMessage(
        message.channel_id!,
        `💸Số dư của bạn là ${result?.amount} ₫ `,
        message?.message_id!
      );
      await sendLog(
        `Balance for user ${message.sender_id} is ${result?.amount}`
      );
    }
  } catch (error) {
    await sendLog(`Error checking balance for ${message.sender_id}: ${error}`);
    console.error(error);
  }
};

export const giveToken = async (
  leaderboard: any[],
  listClan: any[],
  description: string,
  rewardAmounts: number[]
) => {
  try {
    await sendLog(`Starting to distribute rewards for ${description}`);
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

        await sendLog(
          `Rewarded ${user.username} with ${reward} for rank #${rank} in ${description}`
        );

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
        await sendLog(`⚠️ User not found for rewards: ${userInfo.user_id}`);
        console.warn(`⚠️ Không tìm thấy user: ${userInfo.user_id}`);
      }
    }
  } catch (error) {
    await sendLog(`Error giving tokens: ${error}`);
    console.error(error);
  }
};

export const updateMessage = async (
  message: any,
  channel_id: string,
  message_id: string
) => {
  try {
    const Channel = await client.channels.fetch(channel_id);
    const fetchedMessage = await Channel.messages.fetch(message_id);
    await fetchedMessage.update(message);
    await sendLog(`Updated message ${message_id} in channel ${channel_id}`);
  } catch (error) {
    await sendLog(`Error updating message ${message_id}: ${error}`);
    console.log(error);
  }
};
