import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

class BlacklistedUser extends Model {
  declare id: number;
  declare user_id: string;
  declare clan_id: string;
  declare blacklisted_date: Date;
}

BlacklistedUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clan_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    blacklisted_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "BlacklistedUser",
    tableName: "blacklisted_users",
    timestamps: true,
  }
);

export default BlacklistedUser;
