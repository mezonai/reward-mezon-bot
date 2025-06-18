import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface UserClanMessageAttributes {
  id: number;
  user_id: string;
  clan_id: string;
  countmessage: number;
}

interface UserClanMessageCreationAttributes
  extends Optional<UserClanMessageAttributes, "id"> {}

class UserClanMessage
  extends Model<UserClanMessageAttributes, UserClanMessageCreationAttributes>
  implements UserClanMessageAttributes
{
  declare id: number;
  declare user_id: string;
  declare clan_id: string;
  declare countmessage: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserClanMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clan_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    countmessage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  
  {
    sequelize,
    modelName: "UserClanMessage",
    tableName: "user_clan_messages",
    timestamps: true,
    indexes: [
      {
        unique: false,
        fields: ["user_id", "clan_id"],
      },
    ],
  }
);

export default UserClanMessage;
