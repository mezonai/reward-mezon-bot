import {
  formatLeaderboard,
  formatLeaderboardMessage,
  formatListRole,
  formatListTrophy,
  formatListTrophyUser,
} from "../ultis/constant";

import { ChannelMessage } from "mezon-sdk";
import { format, getMonth, getWeek } from "date-fns";
import User from "../models/User";
import { client } from "../config/mezon-client";
import { components, embedReward, embedTrophy } from "../ultis/form";
import { Reward } from "../models";
import RoleReward from "../models/Role_rewards";
import { replyMessage, sendMessage } from "../ultis/message";
import { kttkUser, sendToken } from "../ultis/fn";
import { rewardToolService } from "../ultis/call-tool";

interface Action {
  action: "new" | "upd" | "del";
}

export const commands = {
  help: {
    description: "Hiển thị danh sách các lệnh có sẵn",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const helpText = `
              🏆 **Reward - Help Menu:** 👑
       
      !help - Hiển thị danh sách lệnh
      !trophy new  - Tạo trophy mới 
      !trophy upd | tên trophy - Cập nhật trophy
      !trophy del | tên trophy - xóa trophy
      !list_trophy - Xem danh sách trophy
      !award @người dùng | Trophy Name - (Trao trophy cho người dùng)
      !rank  or !rank số hạng - Xem bảng xếp hạng reward 
      !trophies or !trophies user - Xem danh sách trophy của người dùng hoặc của bản thân
      !list - Xem danh sách role rewards 
      !reward del | tên role name - xóa role reward
      !reward new - tạo role reward
      !reward upd | tên role name  - cập nhật role reward
      !top - Xem bảng xếp hạng hạng thành viên tích cực trong ngày
      !top_week - Xem bảng xếp hạng trophy tuần này
      !top_month - Xem bảng xếp hạng trophy tháng này
      !kttk - kiểm tra tài khoản
      !rut - rút tiền
            `;
      await replyMessage(message?.channel_id!, helpText, message?.message_id!);
    },
  },

  trophy: {
    description: "Tạo một trophy mới",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const fullArg = args.join(" ");
      const [action, name, description, points] = fullArg
        .split("|")
        .map((s) => s.trim());

      const fetchedChannel = await client.channels.fetch(message.channel_id);
      const fetchedMessage = await fetchedChannel.messages.fetch(
        message?.message_id!
      );

      if (action === "del") {
        const result = await rewardToolService.crudTrophy(
          action as Action["action"],
          name,
          description,
          +points,
          message?.sender_id
        );
        if (
          result &&
          Array.isArray(result.content) &&
          typeof result.content[0]?.text === "string"
        ) {
          await replyMessage(
            message.channel_id,
            result.content[0].text,
            message?.message_id!
          );
          return;
        } else {
          await sendMessage(
            message.channel_id,
            "Lỗi: Không thể xử dý kết quả trả về."
          );
        }
      }

      if (action === "upd") {
        const trophy = await Reward.findOne({ where: { name } });

        if (!trophy) {
          await replyMessage(
            message.channel_id,
            "Not found trophy",
            message?.message_id!
          );
          return;
        }

        await fetchedMessage.reply({
          embed: embedTrophy("trophy", action, trophy?.dataValues),
          components: components("trophy", action, trophy?.dataValues),
        });

        return;
      }

      if (action === "new") {
        await fetchedMessage.reply({
          embed: embedTrophy("trophy", action),
          components: components("trophy", action),
        });
      }
    },
  },

  award: {
    description: "Trao trophy cho người dùng",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const fullArg = args.join(" ");
      const [name, rewardName] = fullArg.split("|").map((s) => s.trim());
      const userName = name.replace("@", "").trim();
      const result = await rewardToolService.awardTrophy(
        user_id,
        rewardName,
        userName,
        message.sender_id
      );
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        await replyMessage(
          message.channel_id,
          result.content[0].text,
          message?.message_id!
        );
      } else {
        await sendMessage(
          message.channel_id,
          "Lỗi: Không thể xử dý kết quả trả về."
        );
      }
    },
  },

  rank: {
    description: "Xem bảng xếp hạng reward của người dùng",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const fullArg = args.join(" ");
      const result = await rewardToolService.rankReward(
        +fullArg ? +fullArg : 10
      );

      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(JSON.parse(result.content[0].text));

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Lỗi: Không thể xử dý kết quả trả về."
        );
      }
    },
  },

  trophies: {
    description: "Xem danh sách trophy của người dùng",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const result = await rewardToolService.trophyUser(
        user_id ? user_id : message?.sender_id!
      );
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatListTrophyUser(JSON.parse(result.content[0].text));

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Lỗi: Không thể xử dý kết quả trả về."
        );
      }
    },
  },

  list: {
    description: "Xem danh sách role rewards ",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const result = await rewardToolService.listRoleRewards();
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatListRole(JSON.parse(result.content[0].text));
        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Lỗi: Không thể xử dý kết quả trả về."
        );
      }
    },
  },

  reward: {
    description: "Mốc điểm cho point",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const fullArg = args.join(" ");
      const [action, roleName, score] = fullArg.split("|").map((s) => s.trim());

      const fetchedChannel = await client.channels.fetch(message.channel_id);
      const fetchedMessage = await fetchedChannel.messages.fetch(
        message?.message_id!
      );

      if (action === "del") {
        const result = await rewardToolService.assignRoleOnScore(
          action as Action["action"],
          roleName,
          +score || 0
        );
        if (
          result &&
          Array.isArray(result.content) &&
          typeof result.content[0]?.text === "string"
        ) {
          await replyMessage(
            message.channel_id,
            result.content[0]?.text,
            message?.message_id!
          );
        } else {
          await sendMessage(
            message.channel_id,
            "Lỗi: Không thể xử dý kết quả trả về."
          );
        }
      }

      if (action === "upd") {
        const reward = await RoleReward.findOne({
          where: { role_name: roleName },
        });

        if (!reward) {
          await replyMessage(
            message.channel_id,
            "Not found reward",
            message?.message_id!
          );
          return;
        }

        await fetchedMessage.reply({
          embed: embedReward("reward", action, reward?.dataValues),
          components: components("reward", action, reward?.dataValues),
        });

        return;
      }

      if (action === "new") {
        await fetchedMessage.reply({
          embed: embedReward("reward", action),
          components: components("reward", action),
        });
      }
    },
  },

  list_trophy: {
    description: "Xem danh sách trophy ",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const result = await rewardToolService.listTrophy();
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatListTrophy(JSON.parse(result.content[0].text));
        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Lỗi: Không thể xử dý kết quả trả về."
        );
      }
    },
  },

  ask: {
    description: "hỏi bot reward",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      try {
        const question = args.join(" ");
        const result = await rewardToolService.sendMessage(message, question);
        if (
          result &&
          Array.isArray(result.content) &&
          typeof result.content[0]?.text === "string"
        ) {
          await replyMessage(
            message.channel_id,
            result.content[0].text,
            message?.message_id!
          );
        }
      } catch (error) {
        console.log(error);
      }
    },
  },

  top: {
    description: "Xem danh sách top reward ngày",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const channel = await client.channels.fetch("1840686830249316352");
      const messages = channel.messages.values();
      const context = Array.from(messages).map((msg) => ({
        author: msg.sender_id,
        content: msg.content?.t,
        sender_id: msg.sender_id,
      }));

      const result = await rewardToolService.topDay();
      const day = format(new Date(), "yyyy-MM-dd");
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboardMessage(
          JSON.parse(result.content[0].text),
          `ngày ${day}`
        );

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Lỗi: Không thể xử dý kết quả trả về."
        );
      }
    },
  },

  top_week: {
    description: "Xem danh sách top reward tuần",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const result = await rewardToolService.topWeek();
      const week = getWeek(new Date());
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(
          JSON.parse(result.content[0].text),
          `Tuần ${week}`
        );

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Lỗi: Không thể xử dý kết quả trả về."
        );
      }
    },
  },
  top_month: {
    description: "Xem danh sách top reward tháng",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const result = await rewardToolService.topMonth();
      const month = getMonth(new Date()) + 1;
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(
          JSON.parse(result.content[0].text),
          `Tháng ${month}`
        );

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(
          message.channel_id,
          "Lỗi: Không thể xử dý kết quả trả về."
        );
      }
    },
  },

  kttk: {
    description: "Kiểm tra tài khoản",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      await kttkUser(message);
    },
  },
  rut: {
    description: "rut token",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      let money = Number(args[0] || 0);
      let user = await User.findOne({ where: { user_id: message.sender_id } });
      if (!user || user.amount == 0 || money > user.amount) {
        await replyMessage(
          message.channel_id,
          "💸Số dư của bạn không đủ để rút hoặc số tiền rút không hợp lệ ",
          message.message_id!
        );
        return;
      } else {
        money = money == 0 ? user.amount : money;
      }

      await sendToken(message, money);
    },
  },
};
