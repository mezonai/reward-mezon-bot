import Reward from "./Reward";
import UserReward from "./User_reward";

Reward.hasMany(UserReward, {
  foreignKey: "reward_id",
  onDelete: "CASCADE",
});

UserReward.belongsTo(Reward, {
  foreignKey: "reward_id",
  onDelete: "CASCADE",
});

export { Reward, UserReward };
