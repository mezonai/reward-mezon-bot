import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import User from "./User";

export enum TransactionType {
  WITHDRAWAL = "withdrawal",
  DEPOSIT = "send_token",
  TROPHY_REWARD = "trophy_reward",
  TOP_REWARD = "top_reward",
  REFUND = "refund",
}

interface TransactionAttributes {
  id: number;
  amount: number;
  transaction_type: TransactionType;
  sender_id: string;
  receiver_id: string;
  description: string;
  status: boolean;
}

interface TransactionCreationAttributes
  extends Optional<TransactionAttributes, "id"> {}

class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  declare id: number;
  declare amount: number;
  declare transaction_type: TransactionType;
  declare sender_id: string;
  declare receiver_id: string;
  declare description: string;
  declare status: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    transaction_type: {
      type: DataTypes.ENUM(...Object.values(TransactionType)),
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
    },
    receiver_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Transaction",
    tableName: "transactions",
    timestamps: true,
  }
);

export default Transaction;
