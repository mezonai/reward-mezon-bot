import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

class BlacklistedUser extends Model {
  declare user_id: string;
  declare blacklisted_date: Date;
}

BlacklistedUser.init(
  {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true,
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
