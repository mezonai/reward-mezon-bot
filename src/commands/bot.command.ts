import { se } from "date-fns/locale";
import {
  formatLeaderboard,
  formatListRole,
  formatListTrophy,
} from "../ultis/constant";
import {
  awardTrophy,
  createTrophy,
  listRoleRewards,
  rankReward,
  sendMessage,
  trophyUser,
} from "../ultis/fn";

export const commands = {
  help: {
    description: "Hiển thị danh sách các lệnh có sẵn",
    execute: async (
      channel: string,
      sender_id: any,
      user_id: any,
      server: string,
      args: string[],
    ) => {
      const helpText = `
🎮 **Danh sách lệnh:**
*help - Hiển thị danh sách lệnh
*new - Tạo trophy mới - *new tên troply | mô tả | giá trị
*trophy_award @người dùng | Trophy Name - Trao trophy cho người dùng
*rank - Xem bảng xếp hạng trophy
*trophy or *trophy user - Xem danh sách trophy của người dùng
*list - Xem danh sách role rewards của người dùng
            `;
      await sendMessage(channel, helpText, server);
    },
  },

 
  new: {
    description: "Tạo một trophy mới",
    execute: async (
      channel: string,
      sender_id: any,
      user_id: any,
      server: string,
      args: string[],
    ) => {
      if (!args || args.length === 0) {
        await sendMessage(channel, {
          t: "Điền thông tin trophy",
          ui: {
            fields: [
              { name: "name", label: "Tên trophy", type: "text" },
              { name: "description", label: "Mô tả", type: "textarea" },
              {
                name: "icon",
                label: "Biểu tượng",
                type: "text",
                optional: true,
              },
              { name: "value", label: "Giá trị", type: "number" },
            ],
            tool_call: "create-trophy",
          },
        }, server);
      } else {
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
          await sendMessage(channel, result.content[0].text, server);
        } else {
          await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.", server);
        }
      }
    },
  },

  trophy_award: {
    description: "Trao trophy cho người dùng",
    execute: async (
      channel: string,
      sender_id: any,
      user_id: any,
      server: string,
      args: string[],
    ) => {
      const fullArg = args.join(" ");
      const [Name, rewardName] = fullArg.split("|").map((s) => s.trim());
      const userName = Name.replace("@", "").trim();

      console.log("userName", userName);
      console.log("user_id", user_id);
      console.log("rewardName", rewardName);

      const result = await awardTrophy(user_id, rewardName, userName);
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        await sendMessage(channel, result.content[0].text, server);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.", server);
      }
    },
  },

  rank: {
    description: "Xem bảng xếp hạng người dùng",
    execute: async (
      channel: string,
      sender_id: any,
      user_id: any,
      server: string,
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


        await sendMessage(channel, text, server);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.", server);
      }
    },
  },

  trophy: {
    description: "Xem danh sách trophy của người dùng",
    execute: async (
      channel: string,
      sender_id: any,
      user_id: any,
      server: string,
      args: string[],
    ) => {
      if (!sender_id)
        return await sendMessage(channel, "Cú pháp: !trophy or !trophy  user", server );
      const result = await trophyUser(user_id ? user_id : sender_id);

      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatListTrophy(JSON.parse(result.content[0].text));

        await sendMessage(channel, text, server);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.", server);
      }
    },
  },

  list: {
    description: "Xem danh sách role rewards ",
    execute: async (
      channel: string,
      sender_id: any,
      user_id: any,
      server: string,
      args: string[],
    ) => {
      const result = await listRoleRewards();
      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatListRole(JSON.parse(result.content[0].text));

        await sendMessage(channel, text, server);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.", server);
      }
    },
  },

  // trophy_role: {
  //   description: "Gán role khi đạt điểm",
  //   execute: async (
  //     channel: string,
  //     sender_id: string,
  //     user_id: string,
  //     args: string[]
  //   ) => {
  //     const [roleId, score] = args;
  //     if (!roleId || isNaN(Number(score)))
  //       return await sendMessage(
  //         channel,
  //         "Cú pháp: !trophy role <roleId> <score>"
  //       );

  //       await callTool("assign-role-on-score", {
  //         roleId,
  //         scoreThreshold: Number(score),
  //       });
  //     await sendMessage(
  //       channel,
  //       `✅ Đã cấu hình gán role ${roleId} khi đạt ${score} điểm.`
  //     );
  //   },
  // },
};
