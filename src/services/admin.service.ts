import User from "../models/User";
import Transaction, { TransactionType } from "../models/Transaction";
import sequelize from "../config/database";

export class AdminService {
  public async updateUserAmount(
    userId: string,
    newAmount: number,
    reason: string = "Admin update"
  ) {
    try {
      const t = await sequelize.transaction();

      try {
        const user = await User.findOne({
          where: { user_id: userId },
          transaction: t,
        });

        if (!user) {
          throw new Error("User not found");
        }

        const oldAmount = user.amount;
        const targetAmount = oldAmount + Number(newAmount);

        await user.update({ amount: targetAmount }, { transaction: t });

        await Transaction.create(
          {
            amount: newAmount,
            transaction_type: TransactionType.DEPOSIT,
            sender_id: userId,
            receiver_id: userId,
            description: `${reason}: Amount updated from ${oldAmount} to ${targetAmount}`,
            status: true,
          },
          { transaction: t }
        );

        await t.commit();

        return {
          success: true,
          oldAmount,
          newAmount: targetAmount,
          difference: newAmount,
          message: `User amount updated from ${oldAmount} to ${targetAmount}`,
        };
      } catch (error) {
        await t.rollback();
        throw error;
      }
    } catch (error) {
      console.error("Error updating user amount:", error);
      throw error;
    }
  }

  public async decreaseUserAmount(
    userId: string,
    decreaseBy: number,
    reason: string = "Admin decrease"
  ) {
    if (decreaseBy <= 0) {
      throw new Error("Decrease amount must be greater than 0");
    }
    const t = await sequelize.transaction();
    try {
      const user = await User.findOne({
        where: { user_id: userId },
        transaction: t,
        lock: true,
      });
      if (!user) {
        throw new Error("User not found");
      }

      const oldAmount = Number(user.amount) || 0;
      const newAmount = oldAmount - Number(decreaseBy);

      await user.update({ amount: newAmount }, { transaction: t });

      await Transaction.create(
        {
          amount: decreaseBy,
          transaction_type: TransactionType.WITHDRAWAL,
          sender_id: user.user_id,
          receiver_id: user.user_id,
          description: `${reason}: Amount decreased by ${decreaseBy} from ${oldAmount} to ${newAmount}`,
          status: true,
        },
        { transaction: t }
      );

      await t.commit();

      return {
        success: true,
        oldAmount,
        newAmount,
        difference: newAmount - oldAmount,
        message: `User amount decreased from ${oldAmount} to ${newAmount}`,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

export const adminService = new AdminService();
