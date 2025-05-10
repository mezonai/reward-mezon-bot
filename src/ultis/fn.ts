import { clientMCP } from "../config/connect";
import { client } from "../config/mezon-client";
import { ChannelMessage, ChannelMessageContent, EMarkdownType } from "mezon-sdk";
import { formatLeaderboard, formatMessageReply } from "./constant";
import { channel } from "diagnostics_channel";
import { TextChannel } from "mezon-sdk/dist/cjs/mezon-client/structures/TextChannel";
import { getMonth, getWeek, subDays } from "date-fns";
import User from "../models/User";



export const sendMessage = async (
  channel: string,
  message: string,
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
      action
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
      sender_id
    },
  });
};

export const rankReward = async (limit: number = 10) => {
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
  point_threshold: number,
) => {


  return await clientMCP.callTool({
    name: "assign-role-on-score",
    arguments: {
      role_name: roleName,
      point_threshold,
      action
    },
  });

}

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
    }
  });
};

export const topMonth = async () => {
  return await clientMCP.callTool({
    name: "top-month",
    arguments: {
      date: new Date().toISOString().split("T")[0],
    }
  });
};


export const replyMessage = async (
  channelId: string,
  message: string,
  message_id: string,
) => {
  const fetchedChannel = await client.channels.fetch(channelId);
  const fetchedMessage = await fetchedChannel.messages.fetch(message_id);
  const repyMessage = formatMessageReply(message)
  await fetchedMessage.reply({
    t: repyMessage,
    mk: [
      {
        type: EMarkdownType.TRIPLE,
        s: 0,
        e: repyMessage.length,
      },
    ],
  })
}


export const showTopWeek = async () => {
  const listClan = [...client.clans.values()]
  const result = await topWeek();
  const week = getWeek(subDays(new Date(), 1));
  for (const clan of listClan) {
    const listchannel = [...clan.channels.values()]
    for (const channel of listchannel) {
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(JSON.parse(result.content[0].text), `Tuần ${week}`);
        await sendMessage(channel?.id!, text, clan.id);
      } else {
        await sendMessage(channel?.id!, " ⚠️ Lỗi: Không thể xử lý kết quả trả về.", clan.id);
      }
    }
  }
}

export const showTopMonth = async () => {
  const listClan = [...client.clans.values()]
  const result = await topMonth();

  const month = getMonth(subDays(new Date(), 1)) + 1;
  for (const clan of listClan) {
    const listchannel = [...clan.channels.values()]
    for (const channel of listchannel) {
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(JSON.parse(result.content[0].text), `Tháng ${month}`);
        await sendMessage(channel?.id!, text, clan.id);
      } else {
        await sendMessage(channel?.id!, " ⚠️ Lỗi: Không thể xử lý kết quả trả về.", clan.id);
      }
    }
  }

}

export const addUser = (user_id: string, username: string, amount: number) => {
  return clientMCP.callTool({
    name: "add-user",
    arguments: {
      user_id,
      username,
      amount
    }
  })
}





export const sendToken = async (message: ChannelMessage, money: number) => {
  try {
    const dataSendToken = {
      sender_id: process.env.BOT,
      sender_name: process.env.BOT_NAME,
      receiver_id: message.sender_id,
      amount: +money,
    };
    await client.sendToken(dataSendToken);

    const user = await User.findOne({ where: { user_id: message.sender_id } })

    if (user) {
      user.amount = Number(user.amount) - money
      await user?.save()
    }
    await replyMessage(message.channel_id, `💸 Rút ${money} token thành công`, message.message_id!);
  } catch (error) {
    console.log(error)
  }

}


export const kttkUser = async (message: ChannelMessage) => {
  try {
    const result = await User.findOne({ where: { user_id: message.sender_id } })
    if (!result) {
      await replyMessage(message.channel_id!, `User not found`, message?.message_id!)
    }
    await replyMessage(message.channel_id!, `💸Số dư của bạn là ${result?.amount} token`, message?.message_id!);
  } catch (error) {
    console.error(error)
  }
}






