import { z } from "zod";
import { findChannel } from "../config/mezon-client";
import {
  AskGeminiSchema,
  AwardTrophySchema,
  CreateRewardSchema,
  GetLeaderboardSchema,
  SendMessageSchema,
} from "./schema/tool_schema";
import Reward from "../models/Reward";
import UserReward from "../models/User_reward";
import sequelize from "../config/database";
import { QueryTypes } from "sequelize";

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

          const result = await Reward.findOne({
            where: { name: rewardName.toLowerCase() },
          });

          if (result) {
            rewardId = result.id;
          } else {
            throw new Error(`Reward '${rewardName}' not found`);
          }

          await UserReward.create({
            reward_id: rewardId,
            user_id: userId,
            user_name: userName,
          });

          const totalPointsResult: any = await sequelize.query(
            `
        SELECT SUM(r.points) AS total_points
        FROM rewards r
        JOIN user_rewards ur ON ur.reward_id = r.id
        WHERE ur.user_id = :userId
      `,
            {
              replacements: { userId },
              type: QueryTypes.SELECT,
            }
          );

          console.error("totalPointsResult", totalPointsResult);

          const totalPoints = parseInt(
            totalPointsResult[0]?.total_points || "0",
            10
          );

          console.error("totalPoints", totalPoints);

          const roleRewards: { point_threshold: number; role_name: string }[] =
            await sequelize.query(
              `
          SELECT point_threshold, role_name
          FROM role_rewards
          ORDER BY point_threshold ASC
        `,
              {
                type: QueryTypes.SELECT,
              }
            );

          let newRole = null;
          for (const role of roleRewards) {
            if (totalPoints >= role.point_threshold) {
              newRole = role.role_name;
            }
          }

          if (newRole) {
            const [existingRole] = await sequelize.query(
              `
          SELECT 1
          FROM user_roles
          WHERE user_id = :userId 
        `,
              {
                replacements: { userId },
                type: QueryTypes.SELECT,
              }
            );

            if (!existingRole) {
              await sequelize.query(
                `
            INSERT INTO user_roles (user_id, role_name, total_point)
            VALUES (:userId, :roleName, :totalPoints)
          `,
                {
                  replacements: {
                    userId,
                    roleName: newRole,
                    totalPoints,
                  },
                  type: QueryTypes.INSERT,
                }
              );
            } else {
              await sequelize.query(
                `
          UPDATE user_roles
          SET total_point = :totalPoints,
          role_name = :roleName
          WHERE user_id = :userId
        `,
                {
                  replacements: { userId, totalPoints, roleName: newRole },
                  type: QueryTypes.UPDATE,
                }
              );
            }
          }

          return {
            content: [
              {
                type: "text",
                text: `🏆 Đã trao reward ${rewardName} cho @${userName}.`,
              },
            ],
          };
        } catch (error) {
          console.error("Error awarding user:", error);
          return {
            content: [
              {
                type: "text",
                text: "❌ Có lỗi khi trao reward. Vui lòng thử lại.",
              },
            ],
          };
        }
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
        console.log("Fetching leaderboard with limit:", limit);

        const query = `
          SELECT 
          ur.user_name,
          ul.role_name,
          ul.total_point
        FROM user_rewards ur
        JOIN user_roles ul ON ul.user_id = ur.user_id
        GROUP BY ur.user_name, ul.role_name, ul.total_point
          LIMIT :limit
  `;

        try {
          const results = await sequelize.query(query, {
            replacements: { limit },
            type: QueryTypes.SELECT,
          });
          console.error("result", results);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        } catch (err) {
          console.error("Lỗi khi truy vấn:", err);
        }
      }

      // case "assign-role-on-score": {
      //   const { roleId, scoreThreshold } = args;
      //   // Implement role assignment logic
      //   console.log(
      //     `Assigning role ${roleId} when score reaches ${scoreThreshold}`
      //   );

      //   return {
      //     content: [
      //       {
      //         type: "text",
      //         text: `Role ${roleId} assigned successfully for users above score ${scoreThreshold}.`,
      //       },
      //     ],
      //   };
      // }
      case "list-role-rewards": {
        const result = await sequelize.query(
          `
          select role_name, point_threshold from role_rewards ORDER BY point_threshold DESC
        `,
          {
            replacements: {},
            type: QueryTypes.SELECT,
          }
        );

        console.error("result role", result);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get-user-rewards": {
        const { userId } = args;
        const result = await sequelize.query(
          `
          SELECT 
		  r.name, r.points,
		  ur.user_name
          FROM rewards r
          JOIN user_rewards ur ON ur.reward_id = r.id
          WHERE ur.user_id = :userId
        `,
          {
            replacements: { userId },
            type: QueryTypes.SELECT,
          }
        );

        console.error("result reward", result);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2) || "No rewards found",
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

    throw new Error(`An error occurred while processing the tool: ${error}`);
  }
};
