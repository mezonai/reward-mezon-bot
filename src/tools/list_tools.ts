export const ListTools = {
  tools: [
    {
      name: "send-message",
      description: "Send a message to a Mezon channel",
      inputSchema: {
        type: "object",
        properties: {
          server: {
            type: "string",
            description:
              "Clan name or ID (optional if bot is only in one server)",
          },
          channel: {
            type: "string",
            description: 'Channel name (e.g., "general") or ID',
          },
          message: {
            type: "string",
            description: "Message content to send",
          },
        },
        required: ["channel", "message"],
      },
    },
    {
      name: "read-messages",
      description: "Read recent messages from a Mezon channel",
      inputSchema: {
        type: "object",
        properties: {
          server: {
            type: "string",
            description:
              "Clan name or ID (optional if bot is only in one server)",
          },
          channel: {
            type: "string",
            description: 'Channel name (e.g., "general") or ID',
          },
          limit: {
            type: "number",
            description: "Number of messages to fetch (max 100)",
            default: 50,
          },
        },
        required: ["channel"],
      },
    },
    {
      name: "ask-gemini",
      description: "Ask Gemini AI about infomation in a channel",
      inputSchema: {
        type: "object",
        properties: {
          server: {
            type: "string",
            description:
              "Clan name or ID (optional if bot is only in one server)",
          },
          channel: {
            type: "string",
            description: "Channel name or ID",
          },
          question: {
            type: "string",
            description: "The question to ask Gemini",
          },
          tools: {
            type: "array",
            description: "List of tools to use",
          },
          messages: {
            type: "array",
            description: "List of messages to use as context",
          },
          required: ["channel", "question", "messages"],
        },
      },
    },

    {
      name: "award-trophy",
      description: "Award a trophy to a user.",
      inputSchema: {
        type: "object",
        properties: {
          UserId: {
            type: "string",
            description: "Target User ID to award",
          },
          rewardId: {
            type: "string",
            description: "ID of the trophy to award",
          },
        },
        required: ["UserId", "rewardId"],
      },
    },
    {
      name: "create-trophy",
      description: "Create a new trophy for your server.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Trophy name" },
          description: { type: "string", description: "Trophy description" },

          value: { type: "integer", description: "Value of the trophy" },
          icon: {
            type: "string",
            description: "Emoji or Icon",
            nullable: true,
          },
        },
        required: ["name", "description", "value"],
      },
    },
  ],
};
