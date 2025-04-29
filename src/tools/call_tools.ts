import { z } from "zod";
import { findChannel } from "../config/mezon-client";
import {
  AskGeminiSchema,
  AwardTrophySchema,
  CreateRewardSchema,
  GetLeaderboardSchema,
  ReadMessagesSchema,
  SendMessageSchema,
} from "./schema/tool_schema";
import Reward from "../models/Reward";
import UserReward from "../models/User_reward";

export const CallTools = async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "send-message": {
        const {
          server: serverId,
          channel: channelId,
          message,
        } = SendMessageSchema.parse(args);
        const channel = await findChannel(channelId, serverId);

        if (!channel) {
          throw new Error("Channel not found");
        }

        const sent = await channel.send(
          typeof message === "string" ? { t: message } : message
        );
        console.log("Sent message:", sent);

        return {
          content: [
            {
              type: "text",
              text: `Message sent successfully to #${channel.name} in ${channel.clan.name}. Message ID: ${sent.message_id}`,
            },
          ],
        };
      }

      // case "read-messages": {
      //   const {
      //     server: serverId,
      //     channel: channelId,
      //     limit,
      //   } = ReadMessagesSchema.parse(args);
      //   const channel = await findChannel(channelId, serverId);

      //   if (!channel) {
      //     throw new Error("Channel not found");
      //   }

      //   const messages = channel.messages.values();
      //   const formattedMessages = Array.from(messages).map((msg) => ({
      //     channel: `${channel.name}`,
      //     server: channel.clan.name,
      //     author: msg.sender_id,
      //     content: msg.content,
      //     channel_id: channel.id,
      //   }));

      //   return {
      //     content: [
      //       {
      //         type: "text",
      //         text: JSON.stringify(formattedMessages, null, 2),
      //       },
      //     ],
      //   };
      // }

      case "ask-gemini": {
        const {
          server: serverId,
          channel: channelId,
          question,
          messages,
        } = AskGeminiSchema.parse(args);
        const channelMessages = messages.slice(0, -1);
        console.log("Formatted messages:", channelMessages);
        // Call Gemini AI API here if needed and return the response

        return {
          content: [
            {
              type: "text",
              text: `Question asked: ${question}`,
            },
          ],
        };
      }

      case "award-user": {
        const { userId, rewardName, userName } = AwardTrophySchema.parse(args);
        try {
          let rewardId: any;

          console.error("rewardName", rewardName);

          const result = await Reward.findOne({
            where: { name: rewardName.toLowerCase() },
          });

          if (result) {
            rewardId = result?.dataValues?.id;
          }

           await UserReward.create({
            reward_id: rewardId,
            user_id: userId,
            user_name: userName,
          });

          return {
            content: [
              {
                type: "text",
                text: `🏆 Đã trao reward ${rewardName} cho @${userName}.`,
              },
            ],
          };
        } catch (error) {}
      }

      case "create-reward": {
        const { name, description, points, icon, createdBy } =
          CreateRewardSchema.parse(args);
        try {
          await Reward.create({
            name,
            description,
            points,
            icon,
            createdBy,
          });
        } catch (error: any) {
          throw new Error(`Error creating trophy: ${error.message}`);
        }
        return {
          content: [
            {
              type: "text",
              text: `Trophy "${name}" created successfully.`,
            },
          ],
        };
      }

      case "rank": {
        const { limit } = GetLeaderboardSchema.parse(args);
        // Implement leaderboard fetching logic
        console.log(`Fetching top ${limit} users from the leaderboard`);

        return {
          content: [
            {
              type: "text",
              text: `Leaderboard with top ${limit} users fetched successfully.`,
            },
          ],
        };
      }

      case "assign-role-on-score": {
        const { roleId, scoreThreshold } = args;
        // Implement role assignment logic
        console.log(
          `Assigning role ${roleId} when score reaches ${scoreThreshold}`
        );

        return {
          content: [
            {
              type: "text",
              text: `Role ${roleId} assigned successfully for users above score ${scoreThreshold}.`,
            },
          ],
        };
      }

      case "get-user-reward": {
        const { userId } = args;
        // Fetch user trophies logic
        console.log(`Fetching trophies for user ${userId}`);

        return {
          content: [
            {
              type: "text",
              text: `Trophies for user ${userId} fetched successfully.`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }

    // Handle any other errors (e.g., channel not found, API call errors)
    throw new Error(`An error occurred while processing the tool: ${error}`);
  }
};
