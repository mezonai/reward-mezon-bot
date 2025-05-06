import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

class RoleReward extends Model {
  declare id: number;
  declare point_threshold: number;
  declare role_name: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

RoleReward.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    point_threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Mốc điểm cần đạt để nhận role",
    },
    role_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Tên role được gán",
    },
  },
  {
    sequelize,
    tableName: "role_rewards",
    timestamps: true,
  }
);

export default RoleReward;
