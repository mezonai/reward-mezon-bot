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
          message_id: {
            type: "string",
            description: "Message ID to reply to",
          },
          message: {
            type: "string",
            description: "Message content to send",
          },
        },
        required: ["channel", "message", "message_id"],
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
        },
        required: ["userId", "rewardId"],
      },
    },
    {
      name: "create-reward",
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
          icon: {
            type: "string",
            description: "Emoji or Icon (optional)",
          },
          createdBy: {
            type: "string",
            description: "User ID of the creator",
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
          action:{
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
      name: "top-week",
      description: "Get the leaderboard of users by trophy points this week",
      
    },
    {
      name: "top-month",
      description: "Get the leaderboard of users by trophy points this month",
      
    }


  ],
};
