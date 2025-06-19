import Transaction, { TransactionType } from "../models/Transaction";
import User from "../models/User";
import sequelize from "../config/database";
import { Op, WhereOptions } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export class TransactionService {
  private readonly botId: string;

  constructor() {
    this.botId = process.env.BOT || "";
  }

  public async getUserTransactions(userId: string, limit = 10, offset = 0) {
    try {
      const transactions = await Transaction.findAndCountAll({
        where: {
          [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
        },
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      return transactions;
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      throw error;
    }
  }

  public async getTransactionsByType(
    type: TransactionType,
    limit = 10,
    offset = 0
  ) {
    try {
      const transactions = await Transaction.findAndCountAll({
        where: { transaction_type: type },
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      return transactions;
    } catch (error) {
      console.error(`Error fetching ${type} transactions:`, error);
      throw error;
    }
  }

  public async getTransactionsByDateRange(
    startDate: Date,
    endDate: Date,
    limit = 10,
    offset = 0
  ) {
    try {
      const whereOptions: WhereOptions = {};
      (whereOptions as any).createdAt = {
        [Op.between]: [startDate, endDate],
      };

      const transactions = await Transaction.findAndCountAll({
        where: whereOptions,
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      return transactions;
    } catch (error) {
      console.error("Error fetching transactions by date range:", error);
      throw error;
    }
  }

  public async getTransactionStats() {
    try {
      const totalWithdrawals = await Transaction.sum("amount", {
        where: { transaction_type: TransactionType.WITHDRAWAL },
      });

      const totalDeposits = await Transaction.sum("amount", {
        where: { transaction_type: TransactionType.DEPOSIT },
      });

      const totalTrophyRewards = await Transaction.sum("amount", {
        where: { transaction_type: TransactionType.TROPHY_REWARD },
      });

      const totalTopRewards = await Transaction.sum("amount", {
        where: { transaction_type: TransactionType.TOP_REWARD },
      });

      const transactionCounts = await Transaction.count({
        attributes: ["transaction_type"],
        group: ["transaction_type"],
      });

      return {
        amounts: {
          totalWithdrawals: totalWithdrawals || 0,
          totalDeposits: totalDeposits || 0,
          totalTrophyRewards: totalTrophyRewards || 0,
          totalTopRewards: totalTopRewards || 0,
          total:
            (totalWithdrawals || 0) +
            (totalDeposits || 0) +
            (totalTrophyRewards || 0) +
            (totalTopRewards || 0),
        },
        counts: transactionCounts,
      };
    } catch (error) {
      console.error("Error fetching transaction statistics:", error);
      throw error;
    }
  }

  /**
   * Calculate bot's income (money received)
   */
  public async getBotIncome(startDate?: Date, endDate?: Date) {
    try {
      const whereOptions: WhereOptions = {
        receiver_id: this.botId,
      };

      // Add date range if provided
      if (startDate && endDate) {
        (whereOptions as any).createdAt = {
          [Op.between]: [startDate, endDate],
        };
      }

      // Sum all transactions where bot is the receiver
      const totalIncome = await Transaction.sum("amount", {
        where: whereOptions,
      });

      // Get breakdown by transaction type
      const incomeByType = await Transaction.findAll({
        attributes: [
          "transaction_type",
          [sequelize.fn("SUM", sequelize.col("amount")), "total"],
        ],
        where: whereOptions,
        group: ["transaction_type"],
        raw: true,
      });

      return {
        totalIncome: totalIncome || 0,
        breakdown: incomeByType,
      };
    } catch (error) {
      console.error("Error calculating bot income:", error);
      throw error;
    }
  }

  /**
   * Calculate bot's expenses (money spent)
   */
  public async getBotExpenses(startDate?: Date, endDate?: Date) {
    try {
      const whereOptions: WhereOptions = {
        sender_id: this.botId,
      };

      // Add date range if provided
      if (startDate && endDate) {
        (whereOptions as any).createdAt = {
          [Op.between]: [startDate, endDate],
        };
      }

      // Sum all transactions where bot is the sender
      const totalExpenses = await Transaction.sum("amount", {
        where: whereOptions,
      });

      // Get breakdown by transaction type
      const expensesByType = await Transaction.findAll({
        attributes: [
          "transaction_type",
          [sequelize.fn("SUM", sequelize.col("amount")), "total"],
        ],
        where: whereOptions,
        group: ["transaction_type"],
        raw: true,
      });

      return {
        totalExpenses: totalExpenses || 0,
        breakdown: expensesByType,
      };
    } catch (error) {
      console.error("Error calculating bot expenses:", error);
      throw error;
    }
  }

  /**
   * Get bot's balance sheet (income vs expenses)
   */
  public async getBotBalanceSheet(startDate?: Date, endDate?: Date) {
    try {
      const income = await this.getBotIncome(startDate, endDate);
      const expenses = await this.getBotExpenses(startDate, endDate);

      const netBalance = income.totalIncome - expenses.totalExpenses;

      return {
        income: income.totalIncome,
        expenses: expenses.totalExpenses,
        netBalance: netBalance,
        incomeBreakdown: income.breakdown,
        expensesBreakdown: expenses.breakdown,
        period: {
          startDate: startDate || "all time",
          endDate: endDate || "all time",
        },
      };
    } catch (error) {
      console.error("Error generating bot balance sheet:", error);
      throw error;
    }
  }
}

export const transactionService = new TransactionService();

export const getUserTransactions =
  transactionService.getUserTransactions.bind(transactionService);
export const getTransactionsByType =
  transactionService.getTransactionsByType.bind(transactionService);
export const getTransactionsByDateRange =
  transactionService.getTransactionsByDateRange.bind(transactionService);
export const getTransactionStats =
  transactionService.getTransactionStats.bind(transactionService);
export const getBotIncome =
  transactionService.getBotIncome.bind(transactionService);
export const getBotExpenses =
  transactionService.getBotExpenses.bind(transactionService);
export const getBotBalanceSheet =
  transactionService.getBotBalanceSheet.bind(transactionService);
