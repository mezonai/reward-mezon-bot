import { z } from "zod";
import { client } from "../config/mezon-client";
import {
  AddUserSchema,
  AssignRoleOnScoreSchema,
  AwardTrophySchema,
  CrudRewardSchema,
  GetLeaderboardSchema,
  ReadMessagesSchema,
  SendMessageSchema,
  TopSchema,
} from "./schema/tool_schema";
import Reward from "../models/Reward";
import UserReward from "../models/User_reward";
import sequelize from "../config/database";
import { QueryTypes } from "sequelize";
import RoleReward from "../models/Role_rewards";
import {
  addDate,
  afterDate,
  enumBot,
  ERROR_TOKEN,
  getMondayAndSunday,
  getStartandEndOfMonth,
  startsWithSpecialChar,
} from "../ultis/constant";
import User from "../models/User";
import { geminiRewardService } from "../gemini/gemini_reward";
export const CallTools = async (request: any) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case "read-message": {
        await client.login();
        const { channel_id, limit } = ReadMessagesSchema.parse(args);
        const channel = await client.channels.fetch(channel_id);
        const messages = channel.messages.values();
        const context = Array.from(messages).map((msg) => ({
          author: msg.sender_id,
          content: msg.content?.t,
          channel_id: channel_id,
          sender_id: msg.sender_id,
        }));
        const limitContext = context.slice(0, limit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(limitContext, null, 2),
            },
          ],
        };
      }

      case "send-message": {
        const { question, channel_id, context, type } =
          SendMessageSchema.parse(args);
        let response;
        switch (type) {
          case "ask":
            response = await geminiRewardService.sendMessageAndGetResponse(
              question,
              context,
              channel_id
            );
            break;
          case "create_image":
            response = await geminiRewardService.generateImageFromText(
              question
            );
            break;
        }

        return {
          content: [
            {
              type: "text",
              text: response,
            },
          ],
        };
      }

      case "award-user": {
        const { userId, rewardName, userName, sender_id } =
          AwardTrophySchema.parse(args);
        try {
          if (userId === sender_id || userId === process.env.BOT) {
            return {
              content: [
                {
                  type: "text",
                  text: `🏆 Cannot award prizes to self and Bot` as string,
                },
              ],
            };
          }
          const trophy = await Reward.findOne({
            where: { name: rewardName },
          });

          if (!trophy) {
            return {
              content: [
                {
                  type: "text",
                  text: `🏆 ${rewardName} not found in trophy` as string,
                },
              ],
            };
          }

          const UserReceiver = await User.findOne({
            where: { user_id: userId },
          });
          if (!UserReceiver) {
            return {
              content: [
                {
                  type: "text",
                  text: ` found receiver !` as string,
                },
              ],
            };
          }

          const UserGiveTrophy = await User.findOne({
            where: { user_id: sender_id },
          });
          if (!UserGiveTrophy) {
            return {
              content: [
                {
                  type: "text",
                  text: `Not found User give trophy !` as string,
                },
              ],
            };
          }

          if (
            UserGiveTrophy.amount < trophy.points &&
            sender_id !== process.env.BOT
          ) {
            return {
              content: [
                {
                  type: "text",
                  text: ERROR_TOKEN,
                },
              ],
            };
          }

          UserReceiver.amount =
            Number(UserReceiver.amount) + Number(trophy.points);
          UserGiveTrophy.amount =
            Number(UserGiveTrophy.amount) - Number(trophy.points);
          await UserGiveTrophy.save();
          await UserReceiver.save();
          await UserReward.create({
            reward_id: trophy.id,
            user_id: userId,
            user_name: userName,
          });

          return {
            content: [
              {
                type: "text",
                text: ` Đã trao 🏆 ${rewardName} cho @${userName}.` as string,
              },
            ],
          };
        } catch (error) {
          console.error("Error awarding trophy:", error);
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

      case "crud-trophy": {
        const { name, description, points, createdBy, action } =
          CrudRewardSchema.parse(args);
        try {
          if (action === "del") {
            const deletedCount = await Reward.destroy({
              where: { name },
            });

            if (deletedCount === 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: `\n 🏆Trophy "${name}" not found.`,
                  },
                ],
              };
            }
            return {
              content: [
                {
                  type: "text",
                  text: ` \n 🏆 Trophy "${name}" deleted successfully.`,
                },
              ],
            };
          }
          if (action === "upd") {
            const existingReward = await Reward.findOne({
              where: { name },
            });
            if (!existingReward) {
              return {
                content: [
                  {
                    type: "text",
                    text: `\n 🏆 Trophy "${name}" not found.`,
                  },
                ],
              };
            }

            await Reward.update(
              { description, points, createdBy, updatedAt: new Date() },
              { where: { name } }
            );

            return {
              content: [
                {
                  type: "text",
                  text: `\n 🏆 Trophy "${name}" updated successfully.`,
                },
              ],
            };
          }

          if (action === "new") {
            const existingReward = await Reward.findOne({
              where: { name },
            });
            if (existingReward) {
              return {
                content: [
                  {
                    type: "text",
                    text: ` \n 🏆 Trophy "${name}" already exists.`,
                  },
                ],
              };
            }
            await Reward.create({
              name,
              description,
              points,
              createdBy,
            });

            return {
              content: [
                {
                  type: "text",
                  text: `🏆 Trophy "${name}" created successfully.`,
                },
              ],
            };
          }
        } catch (error: any) {
          throw new Error(`Error creating trophy: ${error.message}`);
        }
        return {
          content: [
            {
              type: "text",
              text: `🏆 "${name}" created successfully.`,
            },
          ],
        };
      }

      case "rank": {
        const { limit } = GetLeaderboardSchema.parse(args);
        const query = `
            WITH user_total_points AS (
            SELECT
              ur.user_name,
              SUM(r.points) AS total_point
            FROM user_rewards ur
            JOIN rewards r ON ur.reward_id = r.id
            GROUP BY ur.user_name
          )
          SELECT
            utp.user_name,
            utp.total_point,
            rr.role_name AS role_name
          FROM user_total_points utp
          JOIN LATERAL (
            SELECT role_name
            FROM role_rewards
            WHERE point_threshold <= utp.total_point
            LIMIT 1
          ) rr ON true
		      ORDER BY total_point DESC
          Limit :limit;
  `;

        try {
          const results = await sequelize.query(query, {
            replacements: { limit },
            type: QueryTypes.SELECT,
          });
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

      case "assign-role-on-score": {
        const {
          role_name,
          point_threshold = 0,
          action,
        } = AssignRoleOnScoreSchema.parse(args);

        if (action === "del") {
          const deletedCount = await RoleReward.destroy({
            where: { role_name },
          });

          if (deletedCount === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `🏅Role reward ${role_name} not found.`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: ` 🏅Role reward ${role_name} deleted successfully.`,
              },
            ],
          };
        }
        if (action === "upd") {
          const existingRole = await RoleReward.findOne({
            where: { role_name },
          });
          if (!existingRole) {
            return {
              content: [
                {
                  type: "text",
                  text: `🏅Role reward ${role_name} not found.`,
                },
              ],
            };
          }
          await RoleReward.update(
            {
              point_threshold: point_threshold,
              role_name: role_name,
            },
            {
              where: { role_name },
            }
          );
          return {
            content: [
              {
                type: "text",
                text: `🏅Role reward ${role_name} update successfully for users above score ${point_threshold}.`,
              },
            ],
          };
        }
        if (action === "new") {
          const existingRole = await RoleReward.findOne({
            where: { role_name },
          });
          if (existingRole) {
            return {
              content: [
                {
                  type: "text",
                  text: `🏅 Role reward ${role_name} already exists.`,
                },
              ],
            };
          }
          await RoleReward.create({
            point_threshold: point_threshold,
            role_name: role_name,
          });

          return {
            content: [
              {
                type: "text",
                text: `🏅 Đã tạo Role Reward: ${role_name} với mốc điểm ${point_threshold}.`,
              },
            ],
          };
        }
      }
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

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list-trophy": {
        const result = await sequelize.query(
          `
         select *  from rewards	ORDER BY points DESC;
        `,
          {
            replacements: {},
            type: QueryTypes.SELECT,
          }
        );

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

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2) || "No rewards found",
            },
          ],
        };
      }
      case "top-day": {
        const { date } = TopSchema.parse(args);
        const sqlQuery = `
          SELECT * FROM users
          WHERE user_id <> :BOT and countmessage > 0
          ORDER BY countmessage DESC
          LIMIT 10
        `;

        const result = await sequelize.query(sqlQuery, {
          replacements: { BOT: process.env.BOT! },
          type: QueryTypes.SELECT,
        });

        return {
          content: [
            {
              type: "text",
              text:
                JSON.stringify(result, null, 2) ||
                "👑 Top week is not available",
            },
          ],
        };
      }

      case "top-week": {
        const { date } = TopSchema.parse(args);
        const subdate = afterDate(date, 1);
        const { start_date, end_date } = getMondayAndSunday(subdate);
        const endDate = addDate(end_date, 1);

        const sqlQuery = `
          WITH user_total_points AS (
            SELECT 
              ur.user_name,
              ur.user_id,
              SUM(r.points) AS total_point
            FROM user_rewards ur
            JOIN rewards r ON ur.reward_id = r.id
            WHERE ur."createdAt" >= DATE :start_date
              AND ur."createdAt" < DATE :end_date
            GROUP BY ur.user_name, ur.user_id
          )

          SELECT 
            utp.user_name,
            utp.user_id,
            utp.total_point,
            rr.role_name AS role_name
          FROM user_total_points utp
          JOIN LATERAL (
            SELECT role_name
            FROM role_rewards
            WHERE point_threshold <= utp.total_point
            LIMIT 1
            ) rr ON true
          ORDER BY total_point DESC
          LIMIT 3;
                  `;

        const result = await sequelize.query(sqlQuery, {
          replacements: { start_date, end_date: endDate },
          type: QueryTypes.SELECT,
        });

        return {
          content: [
            {
              type: "text",
              text:
                JSON.stringify(result, null, 2) ||
                "👑 Top week is not available",
            },
          ],
        };
      }
      case "top-month": {
        const { date } = TopSchema.parse(args);
        const subdate = afterDate(date, 1);
        const { start_date, end_date } = getStartandEndOfMonth(subdate);
        const endDate = addDate(end_date, 1);

        const sqlQuery = `
          WITH user_total_points AS (
            SELECT 
              ur.user_name,
               ur.user_id,
              SUM(r.points) AS total_point
            FROM user_rewards ur
            JOIN rewards r ON ur.reward_id = r.id
            WHERE ur."createdAt" >= DATE :start_date
              AND ur."createdAt" < DATE :end_date
            GROUP BY ur.user_name , ur.user_id
          )

          SELECT 
            utp.user_name,
            utp.user_id,
            utp.total_point,
            rr.role_name AS role_name
          FROM user_total_points utp
          JOIN LATERAL (
            SELECT role_name
            FROM role_rewards
            WHERE point_threshold <= utp.total_point
            LIMIT 1
            ) rr ON true
            ORDER BY total_point DESC
          LIMIT 5;
                  `;

        const result = await sequelize.query(sqlQuery, {
          replacements: { start_date, end_date: endDate },
          type: QueryTypes.SELECT,
        });

        return {
          content: [
            {
              type: "text",
              text:
                JSON.stringify(result, null, 2) ||
                " 👑 Top month is not available",
            },
          ],
        };
      }
      case "add-user": {
        try {
          const {
            user_id: userId,
            amount,
            username,
            message,
          } = AddUserSchema.parse(args);

          const existingUser = await User.findOne({
            where: { user_id: userId },
          });
          if (enumBot.some((bot: string) => username.includes(bot))) {
            return {
              content: [
                {
                  type: "text",
                  text: `❌ User ${userId} là bot, không thể thêm..`,
                },
              ],
            };
          }

          if (existingUser) {
            if (!startsWithSpecialChar(message)) {
              existingUser.countmessage += 1;
              await existingUser.save();
            }
            return {
              content: [
                {
                  type: "text",
                  text: `❌ User ${userId} đã tồn tại trong cơ sở dữ liệu hoặc là bot .`,
                },
              ],
            };
          }
          if (username === "Anonymous") {
            return {
              content: [
                {
                  type: "text",
                  text: `❌ User  là Anonymous , không thể thêm..`,
                },
              ],
            };
          }
          await User.create({
            user_id: userId,
            username,
            amount,
            countmessage: 1,
          });

          return {
            content: [
              {
                type: "text",
                text: "✅ Đã thêm user vào cơ sở dữ liệu.",
              },
            ],
          };
        } catch (e: any) {
          console.error("❌ Error creating user: ", e);
          return {
            content: [
              {
                type: "text",
                text: `❌ Lỗi khi thêm user: ${e.message}`,
              },
            ],
          };
        }
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

    throw new Error(`⚠️ An error occurred while processing the tool: ${error}`);
  }
};
