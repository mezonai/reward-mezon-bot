import Reward from "./Reward";
import UserReward from "./User_reward";
import User from "./User";
import Transaction from "./Transaction";

Reward.hasMany(UserReward, {
  foreignKey: "reward_id",
  onDelete: "CASCADE",
});

UserReward.belongsTo(Reward, {
  foreignKey: "reward_id",
  onDelete: "CASCADE",
});

// Define Transaction relationships
User.hasMany(Transaction, {
  foreignKey: "sender_id",
  sourceKey: "user_id",
  as: "SentTransactions",
});

User.hasMany(Transaction, {
  foreignKey: "receiver_id",
  sourceKey: "user_id",
  as: "ReceivedTransactions",
});

Transaction.belongsTo(User, {
  foreignKey: "sender_id",
  targetKey: "user_id",
  as: "Sender",
});

Transaction.belongsTo(User, {
  foreignKey: "receiver_id",
  targetKey: "user_id",
  as: "Receiver",
});

export { default as User } from "./User";
export { default as Reward } from "./Reward";
export { default as UserReward } from "./User_reward";
export { default as UserClanMessage } from "./UserClanMessage";
export { default as BlacklistedUser } from "./BlacklistedUser";
export { default as RoleReward } from "./Role_rewards";
export { default as Transaction } from "./Transaction";
export { TransactionType } from "./Transaction";
