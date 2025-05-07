import { compareAsc, format, parse, subDays, addDays } from "date-fns";

export function formatLeaderboard(data: any[]): string {
  if (data.length === 0) {
    return "❌ Không có 👤 nào trong danh sách.";
  }
  let leaderboard = "🏆 Bảng xếp hạng:\n";
  data.forEach((user, index) => {
    leaderboard += `${index + 1}. 🧑 @${user?.user_name} - ${
      user.total_point
    } 💰 -   ${user.role_name == 'Đồng'? "🥉": user.role_name == 'Bạc'? "🥈" : user.role_name == 'Vàng' ? "🥇": "🏅"}  ${user.role_name}\n`;
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
    leaderboardRole += `- ${item.role_name == 'Đồng'? "🥉": item.role_name == 'Bạc'? "🥈" : item.role_name == 'Vàng' ? "🥇": "🏅"} ${item.role_name} - ${item.point_threshold} 💰 \n`;
  });

  return leaderboardRole.trim();
}

export function getStartOfWeek(date = new Date()) {
  const day = date.getDay();
  return day === 1 ? true : false;
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

export const getMondayAndSunday = (currentDate: Date) => {
  const dayOfWeek = currentDate.getDay();
  const diffToMonday =
    currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(currentDate);
  monday.setDate(diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const diffToSunday = currentDate.getDate() + ((7 - dayOfWeek) % 7);
  const sunday = new Date(currentDate);
  sunday.setDate(diffToSunday);
  sunday.setHours(23, 59, 59, 999);
  const formattedMonday = format(monday, "yyyy-MM-dd");
  const formattedSunday = format(sunday, "yyyy-MM-dd");
  return {
    start_date: formattedMonday,
    end_date: formattedSunday,
  };
};
