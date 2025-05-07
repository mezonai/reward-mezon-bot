import { clientMCP } from "../config/connect";



export const sendMessage = async (
  channel: string,
  message: string,
  message_id: string,
  server :string
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

export const assignRoleOnScore = async (
  action:  "create" | "update" | "delete",
  roleName: string,
  point_threshold: number,
)   => {


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
  });
};
