import { clientMCP } from "../config/connect";

interface McpResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export const sendMessage = async (
  channel: string,
  message: string | object,
  server :string
) => {
  try {
    console.error("Sending message:", message);


    console.error("Channel ID:", channel);
    console.error("Server ID:", server);

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


export const createTrophy = async (
  name: string,
  description: string,
  points: number,
  icon?: string,
  createdBy?: string
) => {
  return await clientMCP.callTool({
    name: "create-reward",
    arguments: {
      name,
      description,
      points,
      icon,
      createdBy,
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
