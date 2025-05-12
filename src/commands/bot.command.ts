import {
  formatLeaderboard,
  formatListRole,
  formatListTrophy,
  formatListTrophyUser,
} from "../ultis/constant";
import {
  assignRoleOnScore,
  awardTrophy,
  crudTrophy,
  kttkUser,
  listRoleRewards,
  listTrophy,
  rankReward,
  replyMessage,
  sendMessage,
  sendToken,
  topMonth,
  topWeek,
  trophyUser,
} from "../ultis/fn";
import { ChannelMessage } from "mezon-sdk";
import { getMonth, getWeek, subDays } from "date-fns";
import User from "../models/User";

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
      !trophy new | tên trophy | mô tả | giá trị - Tạo trophy mới 
      !trophy upd | tên trophy | mô tả | giá trị - Cập nhật trophy
      !trophy del | tên trophy - xóa trophy
      !list_trophy - Xem danh sách trophy
      !award @người dùng | Trophy Name - (Trao trophy cho người dùng)
      !rank  or !rank số hạng - Xem bảng xếp hạng reward 
      !trophies or !trophies user - Xem danh sách trophy của người dùng hoặc của bản thân
      !list - Xem danh sách role rewards 
      !reward del | tên role name - xóa role reward
      !reward new | tên role name | điểm role reward - tạo role reward
      !reward upd | tên role name | điểm role reward - cập nhật role reward
      !top_week - Xem bảng xếp hạng trophy tuần này
      !top_month - Xem bảng xếp hạng trophy tháng này
      !kttk - kiểm tra tài khoản
      !rut - rút tiền
            `;
      await replyMessage(message.channel_id, helpText, message?.message_id!);
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
      const [action, name, description, points, icon] = fullArg
        .split("|")
        .map((s) => s.trim());

      const result = await crudTrophy(
        action as Action["action"],
        name,
        description,
        +points,
        icon,
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
      } else {
        await sendMessage(
          message.channel_id,
          "Lỗi: Không thể xử dý kết quả trả về.",
          message?.clan_id!
        );
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
      const result = await awardTrophy(
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
          "Lỗi: Không thể xử dý kết quả trả về.",
          message?.clan_id!
        );
      }
    },
  },

  rank: {
    description: "Xem bảng xếp hạng người dùng",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const fullArg = args.join(" ");
      const result = await rankReward(+fullArg ? +fullArg : 10);

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
          "Lỗi: Không thể xử dý kết quả trả về.",
          message?.clan_id!
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
      const result = await trophyUser(user_id ? user_id : message?.sender_id!);
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
          "Lỗi: Không thể xử dý kết quả trả về.",
          message?.clan_id!
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
      const result = await listRoleRewards();
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
          "Lỗi: Không thể xử dý kết quả trả về.",
          message?.clan_id!
        );
      }
    },
  },

  reward: {
    description: "Gán role khi đạt điểm",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[]
    ) => {
      const fullArg = args.join(" ");
      const [action, roleName, score] = fullArg.split("|").map((s) => s.trim());
      const result = await assignRoleOnScore(
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
          "Lỗi: Không thể xử dý kết quả trả về.",
          message?.clan_id!
        );
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
      const result = await listTrophy();
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
          "Lỗi: Không thể xử dý kết quả trả về.",
          message?.clan_id!
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
      const result = await topWeek();
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
          "Lỗi: Không thể xử dý kết quả trả về.",
          message?.clan_id!
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
      const result = await topMonth();
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
          "Lỗi: Không thể xử dý kết quả trả về.",
          message?.clan_id!
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
