import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

class Reward extends Model {
  declare id: number;
  declare title: string;
  declare description: string;
  declare points: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Reward.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    points: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "rewards",
    timestamps: true,
  }
);

export default Reward;
