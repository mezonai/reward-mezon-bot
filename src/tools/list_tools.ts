export const ListTools = {
  tools: [
    {
      name: "send-message",
      description: "Send a message to a Mezon channel",
      inputSchema: {
        type: "object",
        properties: {
          channel_id: {
            type: "string",
            description: "Channel id",
          },
          context: {
            type: "array",
            description: "Context of the message",
          },
          question: {
            type: "string",
            description: "The question to ask Ge  mini",
          },
        },
        required: ["channel_id", "message", "question"],
      },
    },
    {
      name: "read-messages",
      description: "Read recent messages from a Mezon channel",
      inputSchema: {
        type: "object",
        properties: {
          channel_id: {
            type: "string",
            description: "Channel id",
          },
          limit: {
            type: "number",
            description: "Limit of messages to read",
          },
        },
        required: ["channel_id", "limit"],
      },
    },

    {
      name: "ask-gemini",
      description: "Ask Gemini AI about infomation in a channel",
      inputSchema: {
        type: "object",
        properties: {
          clan_id: {
            type: "string",
            description:
              "Clan name or ID (optional if bot is only in one server)",
          },
          channel_id: {
            type: "string",
            description: "Channel name or ID",
          },
          message_id: {
            type: "string",
            description: "Message name or ID",
          },

          question: {
            type: "string",
            description: "The question to ask Gemini",
          },
          messages: {
            type: "array",
            description: "List of messages to use as context",
          },
          required: [
            "channel_id",
            "question",
            "messages",
            "clan_id",
            "message_id",
          ],
        },
      },
    },

    {
      name: "award-user",
      description: "Award a trophy to a user",
      inputSchema: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "Target user ID to award",
          },
          rewardId: {
            type: "string",
            description: "ID of the trophy to award",
          },
          userName: {
            type: "string",
            description: "Display name of the user",
          },
          sender_id: {
            type: "string",
            description: "Display id of the user giver trophy",
          },
        },
        required: ["userId", "rewardId"],
      },
    },
    {
      name: "crud-trophy",
      description: "Create a new trophy for your server",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Trophy name",
          },
          description: {
            type: "string",
            description: "Trophy description",
          },
          points: {
            type: "integer",
            description: "Points of the trophy",
          },

          createdBy: {
            type: "string",
            description: "User ID of the creator",
          },
          action: {
            type: "string",
            description: "Action to perform (create, update, delete)",
          },
        },
        required: ["name", "description", "points", "createdBy"],
      },
    },
    {
      name: "rank",
      description: "Get the leaderboard of users by trophy points",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of top users to return",
            default: 10,
          },
        },
      },
    },
    {
      name: "assign-role-on-score",
      description:
        "Assign a role to users when they reach a certain trophy score",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Action to perform (create, update, delete)",
          },
          role_name: {
            type: "string",
            description: "Name of the role to assign",
          },
          point_threshold: {
            type: "number",
            description: "Minimum score required to assign the role",
          },
        },
        required: ["roleName", "point_threshold", "action"],
      },
    },
    {
      name: "get-user-rewards",
      description: "Get the list of trophies awarded to a specific user",
      inputSchema: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "ID of the user",
          },
        },
        required: ["userId"],
      },
    },
    {
      name: "list-role-rewards",
      description: "Get the list of role rewards for a specific user",
    },
    {
      name: "list-trophy",
      description: "get the list of trophies",
    },
    {
      name: "top-day",
      description: "Get the leaderboard of users by trophy points this day",
      inputSchema: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "get total point of day",
          },
        },
      },
    },
    {
      name: "top-week",
      description: "Get the leaderboard of users by trophy points this week",
      inputSchema: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "get total point of week",
          },
        },
      },
    },
    {
      name: "top-month",
      description: "Get the leaderboard of users by trophy points this month",
      inputSchema: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "get total point of month",
          },
        },
      },
    },
    {
      name: "add-user",
      description: "Add a user to the database",
      inputSchema: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description: "name of user",
          },
          user_id: {
            type: "string",
            description: "id of user",
          },
          countmessage: {
            type: "number",
            description: "number messager user",
          },
          amount: {
            type: "number",
            description: "amount of user",
          },
          message: {
            type: "string",
            description: "message user",
          },
        },
      },
      require: ["user_id", "username"],
    },
  ],
};
