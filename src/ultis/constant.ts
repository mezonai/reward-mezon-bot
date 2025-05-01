


export function formatLeaderboard(data: any[]): string {
  let leaderboard = "🏆 Bảng xếp hạng:\n";
  data.forEach((user, index) => {
    leaderboard += `${index + 1}. @${user.user_name} - ${
      user.total_point
    } point -  role reward${user.role_name}\n`;
  });

  return leaderboard.trim();
}

