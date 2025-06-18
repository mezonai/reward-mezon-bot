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
    TopDaySchema,
    TopSchema,
    AddUserRewardSchema,
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
} from "../ultis/constant";
import User from "../models/User";
import UserClanMessage from "../models/UserClanMessage";
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
        const { question, channel_id, context, type, url } =
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
              question,
              url
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
        const { userId, rewardName, userName, sender_id, clan_id } =
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
                  text: `Receiver not found!` as string,
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
                  text: `User giving trophy not found!` as string,
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
            clan_id,
          });

          return {
            content: [
              {
                type: "text",
                text: `Awarded 🏆 ${rewardName} to @${userName}.` as string,
              },
            ],
          };
        } catch (error) {
          console.error("Error awarding trophy:", error);
          return {
            content: [
              {
                type: "text",
                text: "❌ Error awarding reward. Please try again.",
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
        const { limit, clan_id } = GetLeaderboardSchema.parse(args);
        const query = `
             WITH user_total_points AS (
            SELECT
              ur.user_name,
              SUM(r.points) AS total_point
            FROM user_rewards ur
            JOIN rewards r ON ur.reward_id = r.id
            WHERE ur.clan_id = :clan_id
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
            replacements: { limit, clan_id },
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
          console.error("Error when querying:", err);
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
                text: `🏅 Role Reward created: ${role_name} with point threshold ${point_threshold}.`,
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
        const { userId, clan_id } = args;
        const result = await sequelize.query(
          `
          SELECT 
		  r.name, r.points,
		  ur.user_name, ur."createdAt"
          FROM rewards r
          JOIN user_rewards ur ON ur.reward_id = r.id
          WHERE ur.user_id = :userId AND ur.clan_id = :clan_id
        `,
          {
            replacements: { userId, clan_id },
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
        const { date, clan_id } = TopDaySchema.parse(args);

        // Get users from UserClanMessage với join để lấy username
        const sqlQuery = `
          SELECT ucm.user_id, ucm.clan_id, ucm.countmessage, u.username
          FROM user_clan_messages ucm
          JOIN users u ON ucm.user_id = u.user_id
          WHERE ucm.user_id <> :BOT and ucm.clan_id = :clan_id and ucm.countmessage > 0
          ORDER BY ucm.countmessage DESC
          LIMIT 10
        `;

        const result = await sequelize.query(sqlQuery, {
          replacements: { BOT: process.env.BOT!, clan_id },
          type: QueryTypes.SELECT,
        });

        return {
          content: [
            {
              type: "text",
              text:
                JSON.stringify(result, null, 2) ||
                "👑 Top day is not available",
            },
          ],
        };
      }

      case "top-week": {
        const { date, clan_id } = TopSchema.parse(args);
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
            AND ur.clan_id = :clan_id   
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
          replacements: { start_date, end_date: endDate, clan_id },
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
        const { date, clan_id } = TopSchema.parse(args);
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
              AND ur.clan_id = :clan_id   
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
          LIMIT 3;
                  `;

        const result = await sequelize.query(sqlQuery, {
          replacements: { start_date, end_date: endDate, clan_id },
          type: QueryTypes.SELECT,
        });

        return {
          content: [
            {
              type: "text",
              text:
                JSON.stringify(result, null, 2) ||
                "👑 Top month is not available",
            },
          ],
        };
      }
      case "add-user": {
        try {
          let {
            user_id: userId,
            amount,
            username,
            clan_id,
          } = AddUserSchema.parse(args);

          if (userId === process.env.BOT) {
            const existingBot = await User.findOne({
              where: { user_id: userId },
            });
            if (existingBot) {
              return {
                content: [
                  {
                    type: "text",
                    text: `❌ User bot ${userId} already exists in the database.`,
                  },
                ],
              };
            }
            await User.create({
              user_id: userId,
              username,
              amount,
            });
            return {
              content: [
                {
                  type: "text",
                  text: `✅ Added bot user ${userId} to the database.`,
                },
              ],
            };
          }

          if (
            enumBot.some((bot: string) => username.includes(bot)) ||
            username === "Anonymous"
          ) {
            return {
              content: [
                {
                  type: "text",
                  text: `❌ User ${userId} is invalid (bot or Anonymous), cannot be added.`,
                },
              ],
            };
          }

          const existingUser = await User.findOne({
            where: { user_id: userId },
          });

          if (existingUser) {         
            if (clan_id) {
              await UserClanMessage.findOrCreate({
                where: { user_id: userId, clan_id },
                defaults: {
                  user_id: userId,
                  clan_id,
                  countmessage: 0,
                },
              });
            }
            return {
              content: [
                {
                  type: "text",
                  text: `❌ User ${userId} already exists in the database.`,
                },
              ],
            };
          }

          await User.create({
            user_id: userId,
            username,
            amount,
          });

          if (clan_id) {
            await UserClanMessage.create({
              user_id: userId,
              clan_id,
              countmessage: 0,
            });
          }
          return {
            content: [
              {
                type: "text",
                text: `✅ User ${userId} added to the database.`,
              },
            ],
          };
        } catch (e: any) {
          console.error(
            "❌ Error creating user:",
            e.message,
            "| username:",
            args?.username
          );
          return {
            content: [
              { type: "text", text: `❌ Error adding user: ${e.message}` },
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
