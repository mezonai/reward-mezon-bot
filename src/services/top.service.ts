import { format, getMonth, getWeek, subDays, isMonday } from "date-fns";
import User from "../models/User";
import { Reward, UserClanMessage, UserReward } from "../models";
import { Op, Sequelize } from "sequelize";
import { sendMessage } from "./message.service";
import {
  ERROR_TOKEN,
  formatLeaderboard,
  TROPY_MOST_ACTIVE_MEMBER,
} from "../ultis/constant";
import { giveToken } from "./system.service";
import { rewardToolService } from "./call_tool.service";
import BlacklistedUser from "../models/BlacklistedUser";
import { client } from "../config/mezon-client";

interface BlacklistedUserCache {
  user_id: string;
  clan_id: string;
}

export class TopService {
  private readonly botId: string;
  private blacklistedUsers: Set<BlacklistedUserCache> = new Set();
  private lastClearDate: Date = new Date();

  constructor() {
    this.botId = process.env.BOT as string;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await BlacklistedUser.sync();
      await this.loadBlacklistedUsers();
    } catch (error) {
      console.error("Error initializing TopService:", error);
    }
  }

  private async loadBlacklistedUsers(): Promise<void> {
    try {
      const blacklistedFromDb = await BlacklistedUser.findAll();
      this.blacklistedUsers.clear();
      blacklistedFromDb.forEach((user) => {
        this.blacklistedUsers.add({
          user_id: user.user_id,
          clan_id: user.clan_id,
        });
      });
    } catch (error) {
      console.error("Error loading blacklisted users:", error);
      throw error;
    }
  }

  private async clearBlacklistIfMonday(): Promise<void> {
    const today = new Date();
    if (isMonday(today) && this.lastClearDate.getDate() !== today.getDate()) {
      this.blacklistedUsers.clear();
      await BlacklistedUser.destroy({ where: {} });
      this.lastClearDate = today;
    }
  }

  private async addToBlacklist(userId: string, clanId: string): Promise<void> {
    try {
      const blacklistedUser = {
        user_id: userId,
        clan_id: clanId,
      };
      this.blacklistedUsers.add(blacklistedUser);
      await BlacklistedUser.create({
        user_id: userId,
        clan_id: clanId,
        blacklisted_date: new Date(),
      });
    } catch (error) {
      console.error("Error adding user to blacklist:", error);
      throw error;
    }
  }

  private async showTopGeneric(
    message: string,
    arrayUser: string[],
    rewardAmounts: number[],
    type: string,
    clan_id: string
  ): Promise<void> {
    try {
      if (arrayUser.length === 0) {
        return;
      }
      const clan = await client.clans.fetch(clan_id!);
      if (!clan) {
        return;
      }
      if (clan.welcome_channel_id) {
        await Promise.all([
          sendMessage(clan.welcome_channel_id, message),
          giveToken(arrayUser, type, rewardAmounts, clan.welcome_channel_id),
        ]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  public async showTopDay(): Promise<void> {
    try {
      await this.loadBlacklistedUsers();
      let message;
      const points = 10000;
      const subdate = format(subDays(new Date(), 1), "yyyy-MM-dd");
      const clans = await UserClanMessage.findAll({
        attributes: [
          [Sequelize.fn("DISTINCT", Sequelize.col("clan_id")), "clan_id"],
        ],
        where: {
          countmessage: { [Op.gt]: 0 },
        },
        raw: true,
      });

      const clanIds = clans.map((c) => c.clan_id);

      let trophies = await Reward.findOne({
        where: { name: TROPY_MOST_ACTIVE_MEMBER },
      });

      if (!trophies) {
        trophies = await Reward.create({
          name: TROPY_MOST_ACTIVE_MEMBER,
          description: "Active Member",
          points: points,
          createdBy: this.botId,
        });
      }

      for (const clanId of clanIds) {
        const topMessageCounts = await UserClanMessage.findAll({
          where: {
            clan_id: clanId,
            countmessage: {
              [Op.gt]: 0,
            },
            user_id: {
              [Op.not]: this.botId,
            },
          },
          order: [["countmessage", "DESC"]],
          limit: 10,
        });

        const topUsers = [];
        for (const messageCount of topMessageCounts) {
          const user = await User.findOne({
            where: { user_id: messageCount.user_id },
          });

          if (user) {
            topUsers.push({
              ...user.toJSON(),
              countmessage: messageCount.countmessage,
              clan_id: messageCount.clan_id,
            });
          }
        }

        const plainUsers = topUsers.filter(
          (user) =>
            !Array.from(this.blacklistedUsers).some(
              (blacklisted) =>
                blacklisted.user_id === user.user_id &&
                blacklisted.clan_id === clanId
            )
        );

        if (plainUsers.length === 0) {
          break;
        }

        let randomNumber = Math.floor(Math.random() * plainUsers.length);
        const user = plainUsers[randomNumber];

        if (
          user &&
          this.botId &&
          trophies.dataValues.name === TROPY_MOST_ACTIVE_MEMBER
        ) {
          await this.addToBlacklist(user.user_id, user.clan_id);
          const award = await rewardToolService.awardTrophy(
            user.user_id,
            TROPY_MOST_ACTIVE_MEMBER,
            user.username,
            this.botId,
            clanId
          );
          if (
            Array.isArray(award.content) &&
            typeof award.content[0]?.text === "string"
          ) {
            if (award.content[0]?.text === ERROR_TOKEN) {
              message = award.content[0]?.text;
            } else {
              message =
                award.content[0]?.text +
                " is the lucky person in the top 10 active members" +
                " with " +
                user.countmessage +
                " messages" +
                " on " +
                subdate;
            }
            const clan = await client.clans.fetch(clanId);
            if (!clan) {
              break;
            }
            if (clan.welcome_channel_id) {
              await sendMessage(clan.welcome_channel_id, message);
            }
          }
        }
      }
      await UserClanMessage.update({ countmessage: 0 }, { where: {} });
      await this.clearBlacklistIfMonday();
    } catch (error) {
      console.error(error);
    }
  }

  public async showTopWeek(): Promise<void> {
    try {
      const week = getWeek(subDays(new Date(), 1));
      const rewardAmounts = [15000, 10000, 5000];
      let arrayUser: string[] = [];

      const clans = await UserReward.findAll({
        attributes: [
          [Sequelize.fn("DISTINCT", Sequelize.col("clan_id")), "clan_id"],
        ],
        raw: true,
      });

      const clanIds = clans.map((c) => c.clan_id);
      for (const clanId of clanIds) {
        const result = await rewardToolService.topWeek(clanId);

        if (
          result &&
          Array.isArray(result.content) &&
          typeof result.content[0]?.text === "string"
        ) {
          const message = formatLeaderboard(
            JSON.parse(result.content[0].text),
            `Week ${week}`
          );
          arrayUser = JSON.parse(result.content[0].text);
          await this.showTopGeneric(
            message,
            arrayUser,
            rewardAmounts,
            `Week ${week}`,
            clanId!
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  public async showTopMonth(): Promise<void> {
    try {
      const month = getMonth(subDays(new Date(), 1)) + 1;
      let arrayUser: string[] = [];
      const rewardAmounts: number[] = [50000, 30000, 15000];
      const clans = await UserReward.findAll({
        attributes: [
          [Sequelize.fn("DISTINCT", Sequelize.col("clan_id")), "clan_id"],
        ],
        raw: true,
      });

      const clanIds = clans.map((c) => c.clan_id);
      for (const clanId of clanIds) {
        const result = await rewardToolService.topMonth(clanId);
        if (
          result &&
          Array.isArray(result.content) &&
          typeof result.content[0]?.text === "string"
        ) {
          const message = formatLeaderboard(
            JSON.parse(result.content[0].text),
            `Month ${month}`
          );
          arrayUser = JSON.parse(result.content[0].text);

          await this.showTopGeneric(
            message,
            arrayUser,
            rewardAmounts,
            `Month ${month}`,
            clanId!
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export const topService = new TopService();

export const showTopDay = () => topService.showTopDay();
export const showTopWeek = () => topService.showTopWeek();
export const showTopMonth = () => topService.showTopMonth();
