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
    return `🏆 No players in the leaderboard ${
      title ? title : ""
    } `;
  }

  let leaderboard = `🏆 Leaderboard ${title ? title : ""} :\n`;
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
    return `🏆 No players in the leaderboard ${
      title ? title : ""
    } `;
  }
  let leaderboard = `🏆 Leaderboard of active members in ${
    title ? title : ""
  } :\n`;
  data.forEach((user, index) => {
    leaderboard += `${index + 1}. 🧑 @${user?.username} - ${
      user.countmessage
    } messages \n`;
  });

  return leaderboard.trim();
}

export function formatListTrophy(data: any[]): string {
  if (data.length === 0) {
    return "🏆 No trophies in the list 📝.";
  }
  let leaderboard = "📝 Trophy List 🏆:\n";
  data.forEach((item, index) => {
    leaderboard += `${index + 1}. 🏆 ${item?.name} - ${
      item.description
    } -  💰 ${item.points}\n`;
  });

  return leaderboard.trim();
}

export function formatListTrophyUser(data: any[]): string {
  if (data.length === 0) {
    return "🏆 No trophies in the list.";
  }
  let leaderboardTrophy = `📝 Trophy List for ${data[0].user_name}:\n`;
  data.forEach((item) => {
    leaderboardTrophy += `- @${item.user_name} - ${item.points} 💰 -  🏆 ${item.name}\n`;
  });

  return leaderboardTrophy.trim();
}

export function formatListRole(data: any[]): string {
  if (data.length === 0) {
    return "🔥 No roles in the list.";
  }
  let leaderboardRole = `🌟 👑 Role Rewards List 🌟:\n`;
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
  "💸 Your balance is insufficient for awarding or the withdrawal amount is invalid";

export const TROPY_MOST_ACTIVE_MEMBER = "Most active member";

export function startsWithSpecialChar(str?: string): boolean {
  if (!str) return false;
  const regex = /^[#$%^&*!]/;
  return regex.test(str);
}

export function filterMessagesByDateRange(
  messages: Array<{ id: string; timestamp: number }>,
  startDate?: Date,
  endDate?: Date
): Array<{ id: string; timestamp: number }> {
  if (!messages || !Array.isArray(messages)) {
    return [];
  }

  if (!startDate && !endDate) {
    return messages;
  }

  return messages.filter((msg) => {
    const msgDate = new Date(msg.timestamp);
    if (startDate && endDate) {
      return msgDate >= startDate && msgDate <= endDate;
    } else if (startDate) {
      return msgDate >= startDate;
    } else if (endDate) {
      return msgDate <= endDate;
    }
    return true;
  });
}

export function removeCodeBlockTicks(text: string): string {
  if (!text.includes("```")) {
    return text;
  }
  return text.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```/g, "").trim();
  });
}

export const checkAnonymous = (name: string): boolean => {
  if (name == "Anonymous") {
    return true;
  }
  return false;
};

export function imageCreationRequest(message: string): boolean {
  const keywords = [
    /tạo\s*(ảnh|hình|image)/i,
    /(create|generate)\s*(image|picture|photo)/i,
    /chắc\s*tạo\s*(ảnh|hình)/i,
    /muốn\s*tạo\s*(ảnh|hình)/i,
    /vẽ\s*(ảnh|hình)/i,
    /vẽ/i,
  ];

  return keywords.some((pattern) => pattern.test(message));
}

export const resizedUrl = (url: string) => {
  return url.replace("/upload/", "/upload/w_300,c_fill/");
};
