import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

class UserRole extends Model {
  declare id: number;
  declare user_id: string;
  declare role_name: string;
  declare total_point: number;
  declare readonly assignedAt: Date;
}

UserRole.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "ID người dùng",
    },
    role_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Tên role người dùng đang có",
    },
    total_point: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Tổng điểm của người dùng",
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Thời điểm gán role",
    },
  },
  {
    sequelize,
    tableName: "user_roles",
    timestamps: true,
  }
);

export default UserRole;
