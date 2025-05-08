import { clientMCP } from "../config/connect";
import { client } from "../config/mezon-client";
import { EMarkdownType } from "mezon-sdk";



export const sendMessage = async (
  channel: string,
  message: string,
  message_id: string,
  server: string
) => {
  try {



    await clientMCP.callTool({
      name: "send-message",
      arguments: {
        server: server,
        channel,
        message_id,
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
  console.log("action 1", action);
  console.log("name 1", name);
  console.log("description 1", description);
  console.log("points 1", points);
  console.log("icon 1", icon);
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


  console.log("fetchedMessage", message);
  await fetchedMessage.reply({
    t: message,
    mk: [
      {
        type: EMarkdownType.TRIPLE,
        s: 0,
        e: message.length,
      },
    ],
  })
}


