export function formatLeaderboard(data: any[]): string {
  if (data.length === 0) {
    return "❌ Không có người dùng nào trong danh sách.";
  }
  let leaderboard = "🏆 Bảng xếp hạng:\n";
  data.forEach((user, index) => {
    leaderboard += `${index + 1}. @${user?.user_name} - ${
      user.total_point
    } point -  role reward ${user.role_name}\n`;
  });

  return leaderboard.trim();
}

export function formatListTrophy(data: any[]): string {
  if (data.length === 0) {
    return "❌ Không có trophy nào trong danh sách.";
  }
  let leaderboardTrophy = `🏆 List Trophy ${data[0].user_name}:\n`;
  data.forEach((item) => {
    leaderboardTrophy += `- @${item.user_name} - ${item.points} point -  Troply ${item.name}\n`;
  });

  return leaderboardTrophy.trim();
}

export function formatListRole(data: any[]): string {
  if (data.length === 0) {
    return "❌ Không có role nào trong danh sách.";
  }
  let leaderboardRole = `🏅 List role Rewards :\n`;
  data.forEach((item) => {
    leaderboardRole += `- ${item.role_name} - ${item.point_threshold} point \n`;
  });

  return leaderboardRole.trim();
}
