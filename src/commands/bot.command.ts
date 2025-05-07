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
  createTrophy,
  listRoleRewards,
  listTrophy,
  rankReward,
  sendMessage,
  topWeek,
  trophyUser,
} from "../ultis/fn";

interface Action {
  action :  "create" | "update" | "delete",
}

export const commands = {
  "reward_help": {
    description: "Hiển thị danh sách các lệnh có sẵn",
    execute: async (
      channel: string,
      sender_id: string,
      user_id: string,
      server: string,
      message_id:string,
      args: string[],
    ) => {

      const helpText = `
      🎮 **Danh sách lệnh:**
      *reward_help - Hiển thị danh sách lệnh
      *new - Tạo trophy mới - *new tên trophy | mô tả | giá trị
      *list_trophy - Xem danh sách trophy
      *trophy_award @người dùng | Trophy Name - (Trao trophy cho người dùng)
      *rank - Xem bảng xếp hạng trophy
      *top_week - Xem bảng xếp hạng trophy tuần này
      *top_month - Xem bảng xếp hạng trophy tháng này
      *trophy or *trophy user - Xem danh sách trophy của người dùng hoặc của bản thân
      *list - Xem danh sách role rewards 
      *role_reward (
        delete | role_name ) - xóa role_reward
        create | role_name | điểm - tạo role_reward
        update | role_name | điểm - cập nhật role_reward
      )
            `;
      await sendMessage(channel, helpText, message_id, server);
    },
  },

 
  new: {
    description: "Tạo một trophy mới",
    execute: async (
      channel: string,
      sender_id: string,
      user_id: string,
      server: string,
      message_id:string,
      args: string[],
    ) => {
      
        const fullArg = args.join(" ");
        const [name, description, points, icon] = fullArg
          .split("|")
          .map((s) => s.trim());

        const result = await createTrophy(
          name,
          description,
          +points,
          icon,
          sender_id as string
        );

        if (
          result &&
          Array.isArray(result.content) &&
          typeof result.content[0]?.text === "string"
        ) {
          await sendMessage(channel, result.content[0].text, message_id,server);
        } else {
          await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.",message_id,server);
        }
    },
  },

  trophy_award: {
    description: "Trao trophy cho người dùng",
    execute: async (
      channel: string,
      sender_id: string,
      user_id: string,
      server: string,
      message_id:string,
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
        await sendMessage(channel, result.content[0].text,message_id ,server);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.", message_id,server);
      }
    },
  },

  rank: {
    description: "Xem bảng xếp hạng người dùng",
    execute: async (
      channel: string,
      sender_id: string,
      user_id: string,
      server: string,
      message_id:string,
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


        await sendMessage(channel, text, message_id,server);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.",message_id ,server);
      }
    },
  },

  trophy: {
    description: "Xem danh sách trophy của người dùng",
    execute: async (
      channel: string,
      sender_id: string,
      user_id: string,
      server: string,
      message_id:string,
      args: string[],
    ) => {
      if (!sender_id)
        return await sendMessage(channel, "Cú pháp: !trophy or !trophy  user", message_id,server );
      const result = await trophyUser(user_id ? user_id : sender_id);

      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatListTrophyUser(JSON.parse(result.content[0].text));

        await sendMessage(channel, text, message_id,server);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.", message_id,server);
      }
    },
  },

  list: {
    description: "Xem danh sách role rewards ",
    execute: async (
      channel: string,
      sender_id: string,
      user_id: string,
      server: string,
      message_id:string,
      args: string[],
    ) => {
      const result = await listRoleRewards();
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatListRole(JSON.parse(result.content[0].text));

        await sendMessage(channel, text, message_id,server);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.",message_id ,server);
      }
    },
  },

  role_reward : {
    description: "Gán role khi đạt điểm",
    execute: async (
      channel: string,
      sender_id: string,
      user_id: string,
      server: string,
      message_id:string,
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
        await sendMessage(channel,  result.content[0]?.text, message_id,server);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.", message_id,server);
      }
    },
  },

  list_trophy: {
    description: "Xem danh sách trophy ",
    execute: async (
      channel: string,
      sender_id: string,
      user_id: string,
      server: string,
      message_id:string,
      args: string[],
    ) => {
      const result = await listTrophy();
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatListTrophy(JSON.parse(result.content[0].text));

        await sendMessage(channel, text, message_id,server);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.", message_id,server);
      }
    },
  },

  top_week: {
    description: "Xem danh sách top reward tuần",
    execute: async (
      channel: string,
      sender_id: string,
      user_id: string,
      server: string,
      message_id:string,
      args: string[],
    ) => {
      const result = await topWeek();

      console.log("result", result);
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(JSON.parse(result.content[0].text));

        await sendMessage(channel, text, message_id,server);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.", message_id,server);
      }
    },
  },
  
};
