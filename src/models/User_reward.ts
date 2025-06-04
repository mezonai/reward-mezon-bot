import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

class UserReward extends Model {
  declare id: number;
  declare reward_id: number;
  declare user_id: string;
  declare user_name: string;
  declare points: number;
  declare clan_id?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserReward.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    reward_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID của phần thưởng",
    },
    user_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "ID người dùng",
    },
    user_name: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: "Tên hiển thị của người dùng",
    },
    clan_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "ID của clan",
    },
  },
  {
    sequelize,
    tableName: "user_rewards",
    timestamps: true,
  }
);

export default UserReward;
