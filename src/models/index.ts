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

export { default as User } from "./User";
export { default as Reward } from "./Reward";
export { default as UserReward } from "./User_reward";
export { default as UserClanMessage } from "./UserClanMessage";
export { default as BlacklistedUser } from "./BlacklistedUser";
export { default as RoleReward } from "./Role_rewards";
