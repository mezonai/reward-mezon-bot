import { format, getMonth, getWeek, subDays } from "date-fns";
import {
  ERROR_TOKEN,
  formatLeaderboard,
  TROPY_MOST_ACTIVE_MEMBER,
} from "./constant";
import { giveToken } from "./fn";
import User from "../models/User";
import { client } from "../config/mezon-client";
import { Reward } from "../models";
import { Op } from "sequelize";
import { rewardToolService } from "./call-tool";
import { sendMessage } from "./message";

export class TopService {
  private readonly botId: string;

  constructor() {
    this.botId = process.env.BOT as string;
  }

  private async showTopGeneric(
    message: string,
    arrayUser: string[],
    rewardAmounts: number[],
    type: string
  ): Promise<void> {
    try {
      const listClan = [...client.clans.values()];
      for (const clan of listClan) {
        const listchannel = [...clan.channels.values()];
        for (const channel of listchannel) {
          if (channel?.name === "welcome") {
            await sendMessage(channel?.id as string, message);
          }
        }
      }
      await giveToken(arrayUser, listClan, type, rewardAmounts);
    } catch (error) {
      console.log(error);
    }
  }

  public async showTopDay(): Promise<void> {
    try {
      let message;
      const points = 10000;
      const subdate = format(subDays(new Date(), 1), "yyyy-MM-dd");
      const topUsers = await User.findAll({
        where: {
          user_id: { [Op.ne]: this.botId },
        },
        order: [["countmessage", "DESC"]],
        limit: 10,
      });

      let trophies = await Reward.findOne({
        where: { name: TROPY_MOST_ACTIVE_MEMBER },
      });

      if (!trophies) {
        trophies = await Reward.create({
          name: TROPY_MOST_ACTIVE_MEMBER,
          description: "thành viên tích cực",
          points: points,
          createdBy: this.botId,
        });
      }

      const plainUsers = topUsers.map((user) => user.toJSON());
      const randomNumber = Math.floor(Math.random() * topUsers.length);
      const user = plainUsers[randomNumber];

      if (
        user &&
        this.botId &&
        trophies.dataValues.name === TROPY_MOST_ACTIVE_MEMBER
      ) {
        const award = await rewardToolService.awardTrophy(
          user.user_id,
          TROPY_MOST_ACTIVE_MEMBER,
          user.username,
          this.botId
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
              " là người may mắn nằm trong top 10 thành viên tích cực trong ngày " +
              subdate;
          }

          const listClan = [...client.clans.values()];
          for (const clan of listClan) {
            const listchannel = [...clan.channels.values()];
            for (const channel of listchannel) {
              if (channel?.name === "welcome")
                await sendMessage(channel?.id as string, message);
            }
          }
          await User.update({ countmessage: 0 }, { where: {} });
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  public async showTopWeek(): Promise<void> {
    try {
      const result = await rewardToolService.topWeek();
      const week = getWeek(subDays(new Date(), 1));
      const rewardAmounts = [15000, 10000, 5000];
      let arrayUser: string[] = [];

      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const message = formatLeaderboard(
          JSON.parse(result.content[0].text),
          `Tuần ${week}`
        );
        arrayUser = JSON.parse(result.content[0].text);
        await this.showTopGeneric(
          message,
          arrayUser,
          rewardAmounts,
          `Tuần ${week}`
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  public async showTopMonth(): Promise<void> {
    try {
      const result = await rewardToolService.topMonth();
      const month = getMonth(subDays(new Date(), 1)) + 1;
      let arrayUser: string[] = [];
      const rewardAmounts: number[] = [50000, 30000, 15000];

      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const message = formatLeaderboard(
          JSON.parse(result.content[0].text),
          `Tháng ${month}`
        );
        arrayUser = JSON.parse(result.content[0].text);

        await this.showTopGeneric(
          message,
          arrayUser,
          rewardAmounts,
          `Tháng ${month}`
        );
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
