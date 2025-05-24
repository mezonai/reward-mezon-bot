import { Type } from "@google/genai";

export const SendMessageFunctionDeclaration = {
  name: "send-message",
  description: "Send a message to a Mezon channel",
  parameters: {
    type: Type.OBJECT,
    properties: {
      channel_id: {
        type: Type.STRING,
        description: "Channel ID",
      },
      question: {
        type: Type.STRING,
        description: "The question or channel ID",
      },
      username: {
        type: Type.STRING,
        description: "Username",
      },
      type: {
        type: Type.STRING,
        description: "Type of gemini",
      },
    },
    required: ["channel_id", "question", "username"],
  },
};

export const ReadMessagesFunctionDeclaration = {
  name: "read-message",
  description: "Read recent messages from a channel",
  parameters: {
    type: Type.OBJECT,
    properties: {
      channel_id: {
        type: Type.STRING,
        description: "Channel ID",
      },
      limit: {
        type: Type.NUMBER,
      },
    },
    required: ["channel_id", "limit"],
  },
};
