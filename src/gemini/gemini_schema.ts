import { Type } from "@google/genai";

export const SendMessageFunctionDeclaration = {
  name: "send-message",
  description: "Send a message to a Mezon channel",
  parameters: {
    type: Type.OBJECT,
    properties: {
      channe_id: {
        type: Type.STRING,
        description: 'Channel name (e.g., "general") or ID',
      },
      message_id: {
        type: Type.STRING,
        description: "message ID ",
      },
      message: {
        type: Type.STRING,
        description: "Message content to send",
      },
    },
    required: ["channe_id", "message", "message_id"],
  },
};

export const ReadMessageFunctionDeclaration = {
  name: "read-message",
  description: "Read recent messages from a channel",
  parameters: {
    type: Type.OBJECT,
    properties: {
      server: {
        type: Type.STRING,
        description: "Clan name or ID (optional if bot is only in one server)",
      },
      channel: {
        type: Type.STRING,
        description: 'Channel name (e.g., "general") or ID',
      },
      limit: {
        type: Type.NUMBER,
        description: "Number of messages to fetch (max 100)",
        default: 50,
      },
    },
    required: ["channel"],
  },
};
