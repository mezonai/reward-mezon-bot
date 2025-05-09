import { clientMCP } from "../config/connect";
import { client } from "../config/mezon-client";
import { ChannelMessageContent, EMarkdownType } from "mezon-sdk";
import { formatLeaderboard, formatMessageReply } from "./constant";
import { channel } from "diagnostics_channel";
import { TextChannel } from "mezon-sdk/dist/cjs/mezon-client/structures/TextChannel";
import { getMonth, getWeek, subDays } from "date-fns";



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
  userName: string
) => {
  return await clientMCP.callTool({
    name: "award-user",
    arguments: {
      userId,
      rewardName,
      userName,
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




