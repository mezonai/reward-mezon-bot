import { se } from "date-fns/locale";
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
  listRoleRewards,
  listTrophy,
  rankReward,
  replyMessage,
  sendMessage,
  topMonth,
  topWeek,
  trophyUser,
} from "../ultis/fn";
import { ChannelMessage } from "mezon-sdk";

interface Action {
  action: "new" | "upd" | "del",
}

export const commands = {
  "reward_help": {
    description: "Hiển thị danh sách các lệnh có sẵn",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[],
    ) => {

      const helpText = `
      🎮 **Danh sách lệnh:**
      *reward_help - Hiển thị danh sách lệnh
      *trophy new tên trophy | mô tả | giá trị - Tạo trophy mới 
      *trophy upd tên trophy | mô tả | giá trị - Cập nhật trophy
      *trophy del tên trophy - xóa trophy
      *list_trophy - Xem danh sách trophy
      *trophy_award @người dùng | Trophy Name - (Trao trophy cho người dùng)
      *rank - Xem bảng xếp hạng trophy
      *trophys or *trophys user - Xem danh sách trophy của người dùng hoặc của bản thân
      *list - Xem danh sách role rewards 
      *role_reward del | tên role name - xóa role reward
      *role_reward new | tên role name | điểm role reward - tạo role reward
      *role_reward upd | tên role name | điểm role reward - cập nhật role reward
      *top_week - Xem bảng xếp hạng trophy tuần này
      *top_month - Xem bảng xếp hạng trophy tháng này
            `;
      await sendMessage(message.channel_id, helpText, message?.message_id!, message?.clan_id!);
    },
  },


  trophy: {
    description: "Tạo một trophy mới",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[],
    ) => {

      const fullArg = args.join(" ");
      const [action, name, description, points, icon] = fullArg.split("|").map((s) => s.trim());


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
        await replyMessage(message.channel_id, result.content[0].text, message?.message_id!);
      } else {
        await sendMessage(message.channel_id, "Lỗi: Không thể xử dý kết quả trả về.", message?.message_id!, message?.clan_id!);
      }
    },
  },

  trophy_award: {
    description: "Trao trophy cho người dùng",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[],
    ) => {
      const fullArg = args.join(" ");
      const [Name, rewardName] = fullArg.split("|").map((s) => s.trim());
      const userName = Name.replace("@", "").trim();
      const result = await awardTrophy(user_id, rewardName, userName);
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        await replyMessage(message.channel_id, result.content[0].text, message?.message_id!);
      } else {
        await sendMessage(message.channel_id, "Lỗi: Không thể xử dý kết quả trả về.", message?.message_id!, message?.clan_id!);
      }
    },
  },

  rank: {
    description: "Xem bảng xếp hạng người dùng",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[],
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
        await sendMessage(message.channel_id, "Lỗi: Không thể xử dý kết quả trả về.", message?.message_id!, message?.clan_id!);
      }
    },
  },

  trophys: {
    description: "Xem danh sách trophy của người dùng",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[],
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
        await sendMessage(message.channel_id, "Lỗi: Không thể xử dý kết quả trả về.", message?.message_id!, message?.clan_id!);
      }
    },
  },

  list: {
    description: "Xem danh sách role rewards ",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[],
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
        await sendMessage(message.channel_id, "Lỗi: Không thể xử dý kết quả trả về.", message?.message_id!, message?.clan_id!);
      }
    },
  },

  role_reward: {
    description: "Gán role khi đạt điểm",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[],
    ) => {
      const fullArg = args.join(" ");
      const [action, roleName, score] = fullArg.split("|").map((s) => s.trim());
      const result = await assignRoleOnScore(action as Action["action"], roleName, +score || 0);
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        await replyMessage(message.channel_id, result.content[0]?.text, message?.message_id!);
      } else {
        await sendMessage(message.channel_id, "Lỗi: Không thể xử dý kết quả trả về.", message?.message_id!, message?.clan_id!);
      }
    },
  },

  list_trophy: {
    description: "Xem danh sách trophy ",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[],
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
        await sendMessage(message.channel_id, "Lỗi: Không thể xử dý kết quả trả về.", message?.message_id!, message?.clan_id!);
      }
    },
  },

  top_week: {
    description: "Xem danh sách top reward tuần",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[],
    ) => {
      const result = await topWeek();

      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(JSON.parse(result.content[0].text));

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(message.channel_id, "Lỗi: Không thể xử dý kết quả trả về.", message?.message_id!, message?.clan_id!);
      }
    },
  },
  top_month: {
    description: "Xem danh sách top reward tháng",
    execute: async (
      message: ChannelMessage,
      user_id: string,
      args: string[],
    ) => {
      const result = await topMonth();
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(JSON.parse(result.content[0].text));

        await replyMessage(message.channel_id, text, message?.message_id!);
      } else {
        await sendMessage(message.channel_id, "Lỗi: Không thể xử dý kết quả trả về.", message?.message_id!, message?.clan_id!);
      }
    },
  },

};
