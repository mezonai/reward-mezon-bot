import { client } from "../config/connect";

interface McpResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export const sendMessage = async (
  channel: string,
  message: string | object,
  server = "hello888"
) => {
  try {
    console.error("Sending message:", message);

    await client.callTool({
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

export const askGemini = async (
  channel: string,
  question: string,
  messages: any[],
  server?: string
): Promise<McpResponse | null> => {
  try {
    const response = (await client.callTool({
      name: "ask-gemini",
      arguments: {
        server: server || "hello888",
        channel,
        question,
        messages,
      },
    })) as McpResponse;

    if (response?.content?.[0]?.text === "send-message") return null;
    if (response?.content?.[0]?.text === "read-message") return null;

    if (response?.content?.[0]?.text) {
      await sendMessage(channel, response.content[0].text);
    } else {
      await sendMessage(
        channel,
        "Tôi không thể thực hiện yêu cầu  vui lòng thử lại"
      );
    }
    return response;
  } catch (err) {
    console.error("Error", err);
    return null;
  }
};

export const readMessages = async (
  channel: string,
  limit: number = 5,
  server = "hello888"
) => {
  try {
    return await client.callTool({
      name: "read-messages",
      arguments: {
        server: server,
        channel,
        limit,
      },
    });
  } catch (err) {
    console.error("Error reading messages:", err);
    return null;
  }
};

export const createTrophy = async (
  name: string,
  description: string,
  points: number,
  icon?: string,
  createdBy?: string
) => {
  return await client.callTool({
    name: "create-trophy",
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
  return await client.callTool({
    name: "award-user",
    arguments: {
      userId,
      rewardName,
      userName,
    },
  });
};

export const rankReward = async (limit: number = 10) => {
  return await client.callTool({
    name: "rank",
    arguments: {
      limit,
    },
  });
};
