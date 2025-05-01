import { formatLeaderboard } from "../ultis/constant";
import {
  askGemini,
  awardTrophy,
  createTrophy,
  rankReward,
  sendMessage,
} from "../ultis/fn";

export const commands = {
  help: {
    description: "Hiển thị danh sách các lệnh có sẵn",
    execute: async (
      channel: string,
      sender_id: any,
      args: string[],
      user_id: any
    ) => {
      const helpText = `
🎮 **Danh sách lệnh:**
*help - Hiển thị danh sách lệnh
*new - Tạo trophy mới - *new tên troply | mô tả | giá trị
*trophy_reward @người dùng | Trophy Name - Trao trophy cho người dùng
*rank - Xem bảng xếp hạng trophy
*trophy_user <userId> - Xem danh sách trophy của người dùng
*trophy role <roleId> <score> - Gán role khi đạt điểm
            `;
      await sendMessage(channel, helpText);
    },
  },

  ask: {
    description: "Hỏi bot AI",
    execute: async (channel: string, args: string[]) => {
      if (args.length === 0) {
        return await sendMessage(channel, "Vui lòng nhập câu hỏi sau !ask");
      }
      const question = args.join(" ");
      //   await askGemini(channel, question, messages);
    },
  },

  close: {
    description: "Thoát khỏi chế độ hỏi Gemini",
    execute: async (channel: string) => {
      await sendMessage(channel, "🔒 Đã thoát khỏi chế độ hỏi Gemini.");
    },
  },

  trophy_create: {
    description: "Tạo một trophy mới",
    execute: async (channel: string, sender_id: any, args?: string[]) => {
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
        });
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
          await sendMessage(channel, result.content[0].text);
        } else {
          await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.");
        }
      }
    },
  },

  trophy_award: {
    description: "Trao trophy cho người dùng",
    execute: async (
      channel: string,
      sender_id: string,
      user_id: string,
      args: string[]
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
        await sendMessage(channel, result.content[0].text);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.");
      }
    },
  },

  rank: {
    description: "Xem bảng xếp hạng người dùng",
    execute: async (
      channel: string,
      sender_id: string,
      user_id: string,
      args: string[]
    ) => {
      const fullArg = args.join(" ");
      const result = await rankReward(+fullArg);

      if (
        result &&
        Array.isArray(result.content) &&
        typeof result.content[0]?.text === "string"
      ) {
        const text = formatLeaderboard(JSON.parse(result.content[0].text));

        console.error("text", text);

        await sendMessage(channel, text);
      } else {
        await sendMessage(channel, "Lỗi: Không thể xử lý kết quả trả về.");
      }
    },
  },

  trophy_user: {
    description: "Xem danh sách trophy của người dùng",
    execute: async (
      channel: string,
      sender_id: string,
      user_id: string,
      args: string[]
    ) => {
      const userId = args[0];
      if (!userId)
        return await sendMessage(channel, "Cú pháp: !trophy user <userId>");

      //   const result = await callTool("get-user-trophies", { userId });
      //   await sendMessage(channel, result.content[0].text);
    },
  },

  trophy_role: {
    description: "Gán role khi đạt điểm",
    execute: async (channel: string, args: string[]) => {
      const [roleId, score] = args;
      if (!roleId || isNaN(Number(score)))
        return await sendMessage(
          channel,
          "Cú pháp: !trophy role <roleId> <score>"
        );

      //   await callTool("assign-role-on-score", {
      //     roleId,
      //     scoreThreshold: Number(score),
      //   });
      await sendMessage(
        channel,
        `✅ Đã cấu hình gán role ${roleId} khi đạt ${score} điểm.`
      );
    },
  },
};
