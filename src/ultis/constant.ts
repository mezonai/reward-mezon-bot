import {
  format,
  parse,
  subDays,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";

export function formatLeaderboard(data: any[], title?: string): string {
  if (data.length === 0) {
    return `🏆 Không có người chơi nào trong bảng xếp hạng ${
      title ? title : ""
    } `;
  }
  let leaderboard = `🏆 Bảng xếp hạng ${title ? title : ""} :\n`;
  data.forEach((user, index) => {
    leaderboard += `${index + 1}. 🧑 @${user?.user_name} - ${
      user.total_point
    } 💰 -   ${
      user.role_name == "Đồng"
        ? "🥉"
        : user.role_name == "Bạc"
        ? "🥈"
        : user.role_name == "Vàng"
        ? "🥇"
        : "🏅"
    }  ${user.role_name}\n`;
  });

  return leaderboard.trim();
}

export function formatLeaderboardMessage(data: any[], title?: string): string {
  if (data.length === 0) {
    return `🏆 Không có người chơi nào trong bảng xếp hạng ${
      title ? title : ""
    } `;
  }
  let leaderboard = `🏆 Bảng xếp hạng thành viên tích cực trong ${
    title ? title : ""
  } :\n`;
  data.forEach((user, index) => {
    leaderboard += `${index + 1}. 🧑 @${user?.username} - ${
      user.countmessage
    } message \n`;
  });

  return leaderboard.trim();
}

export function formatListTrophy(data: any[]): string {
  if (data.length === 0) {
    return "🏆 Không có trophy trong 📝.";
  }
  let leaderboard = "📝 Danh sách trophy 🏆:\n";
  data.forEach((item, index) => {
    leaderboard += `${index + 1}. 🏆 ${item?.name} - ${
      item.description
    } -  💰 ${item.points}\n`;
  });

  return leaderboard.trim();
}

export function formatListTrophyUser(data: any[]): string {
  if (data.length === 0) {
    return "🏆 Không có trophy nào trong danh sách.";
  }
  let leaderboardTrophy = `📝 List Trophy ${data[0].user_name}:\n`;
  data.forEach((item) => {
    leaderboardTrophy += `- @${item.user_name} - ${item.points} 💰 -  🏆 ${item.name}\n`;
  });

  return leaderboardTrophy.trim();
}

export function formatListRole(data: any[]): string {
  if (data.length === 0) {
    return "🔥 Không có role nào trong danh sách.";
  }
  let leaderboardRole = `🌟 👑 List role Rewards  🌟:\n`;
  data.forEach((item) => {
    leaderboardRole += ` ${
      item.role_name == "Đồng"
        ? "🥉"
        : item.role_name == "Bạc"
        ? "🥈"
        : item.role_name == "Vàng"
        ? "🥇"
        : "🏅"
    } ${item.role_name} - ${item.point_threshold} 💰 \n`;
  });

  return leaderboardRole.trim();
}

export function isFirstDayofWeek(date = new Date()) {
  const day = date.getDay();
  return day === 1;
}

export function getFirstDayOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export const afterDate = (
  dateString: string,
  numberDate: number,
  formatString: string = "yyyy-MM-dd"
): string => {
  const date = parse(dateString, formatString, new Date());
  const subDay = subDays(date, numberDate);
  const formattedDate = format(subDay, formatString);
  return formattedDate;
};

export const addDate = (
  dateString: string,
  numberDate: number,
  formatString: string = "yyyy-MM-dd"
): string => {
  const date = parse(dateString, formatString, new Date());
  const adday = addDays(date, numberDate);
  const formattedDate = format(adday, formatString);
  return formattedDate;
};

export const getMondayAndSunday = (currentDate: Date | string) => {
  if (typeof currentDate === "string") {
    currentDate = parse(currentDate, "yyyy-MM-dd", new Date());
  }
  const startWeek = startOfWeek(currentDate);
  const endWeek = endOfWeek(currentDate);
  const start_date = format(startWeek, "yyyy-MM-dd");
  const end_date = format(endWeek, "yyyy-MM-dd");
  return {
    start_date,
    end_date,
  };
};

export const isFirstDayOfMonth = (date = new Date()): boolean => {
  return date.getDate() === 1;
};

export const getStartandEndOfMonth = (currentDate: Date | string) => {
  if (typeof currentDate === "string") {
    currentDate = parse(currentDate, "yyyy-MM-dd", new Date());
  }
  const startMonth = startOfMonth(currentDate);
  const endMonth = endOfMonth(currentDate);
  const start_date = format(startMonth, "yyyy-MM-dd");
  const end_date = format(endMonth, "yyyy-MM-dd");
  return {
    start_date,
    end_date,
  };
};

export const formatMessage = (message: string) => {
  return "```" + message + "```";
};

export const enumBot = ["KOMU", "CheckIn", "System", "Fumo", "Utility"];

export const MEZON_IMAGE_URL =
  "https://cdn.mezon.vn/1837043892743049216/1840654271217930240/1827994776956309500/857_0246x0w.webp";

export const MEZON_EMBED_FOOTER = {
  text: "Powered by Mezon",
  icon_url: MEZON_IMAGE_URL,
};

export const ERROR_TOKEN =
  "💸Số dư của bạn không đủ để trao thưởng hoặc số tiền rút không hợp lệ";

export const TROPY_MOST_ACTIVE_MEMBER = "Most active member";

export function startsWithSpecialChar(str?: string): boolean {
  if (!str) return false;
  const regex = /^[@#$%^&*!]/;
  return regex.test(str);
}

export function removeCodeBlockTicks(text: string): string {
  if (!text.includes("```")) {
    return text;
  }
  return text.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```/g, "").trim();
  });
}
