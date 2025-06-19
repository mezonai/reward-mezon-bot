import { ChannelMessage } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { replyMessage, updateEmbed } from "../services/message.service";
import { getBotBalanceSheet } from "../services/transaction.service";
import { TransactionType } from "../models/Transaction";
import { EmbedProps } from "../ultis/form";
import { format } from "date-fns";

export class FinanceCommand extends CommandMessage {
  private readonly adminId: string;
  constructor() {
    super();
    this.adminId = "1840678415796015104";
  }
  async execute(args: string[], message: ChannelMessage, commandName?: string) {
    const isAdmin = message.sender_id === this.adminId;
    if (!isAdmin) {
      await replyMessage(
        message.channel_id,
        "❌ You don't have permission to use this command.",
        message.message_id!
      );
      return;
    }

    if (commandName === "balance") {
      await this.showBalanceSheet(message, args);
    }
  }

  private async showBalanceSheet(message: ChannelMessage, args: string[]) {
    try {
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (args.length >= 2) {
        const [startStr, endStr] = args;
        startDate = new Date(startStr);
        endDate = new Date(endStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          await replyMessage(
            message.channel_id,
            "❌ Invalid date format. Please use YYYY-MM-DD format.",
            message.message_id!
          );
          return;
        }
      }

      const balanceSheet = await getBotBalanceSheet(startDate, endDate);

      let incomeText = "Income Breakdown:\n";
      balanceSheet.incomeBreakdown.forEach((item: any) => {
        const type = item.transaction_type;
        const amount = parseFloat(item.total).toLocaleString();
        incomeText += `- ${this.formatTransactionType(type)}: ${amount} ₫\n`;
      });

      let expensesText = "Expenses Breakdown:\n";
      balanceSheet.expensesBreakdown.forEach((item: any) => {
        const type = item.transaction_type;
        const amount = parseFloat(item.total).toLocaleString();
        expensesText += `- ${this.formatTransactionType(type)}: ${amount} ₫\n`;
      });

      const statusMsg = await replyMessage(
        message.channel_id,
        "Generating financial report...",
        message.message_id!
      );

      if (statusMsg) {
        const netBalanceColor =
          balanceSheet.netBalance >= 0 ? "#00FF00" : "#FF0000";

        const embed: EmbedProps[] = [
          {
            color: netBalanceColor,
            title: "Bot Financial Report",
            description:
              `💰 Total Income: ${balanceSheet.income.toLocaleString()} ₫\n` +
              `💸 Total Expenses:${balanceSheet.expenses.toLocaleString()} ₫\n` +
              `📊 Net Balance: ${balanceSheet.netBalance.toLocaleString()} ₫\n` +
              `${incomeText}\n${expensesText}`,
            timestamp: new Date().toISOString(),
            footer: {
              text:
                startDate && endDate
                  ? `Period: ${format(startDate, "yyyy-MM-dd")} to ${format(
                      endDate,
                      "yyyy-MM-dd"
                    )}`
                  : "All time",
            },
          },
        ];
        await updateEmbed(message.channel_id, embed, statusMsg.message_id);
      }
    } catch (error) {
      console.error("Error showing balance sheet:", error);
      await replyMessage(
        message.channel_id,
        "❌ An error occurred while fetching financial data.",
        message.message_id!
      );
    }
  }

  private formatTransactionType(type: string): string {
    switch (type) {
      case TransactionType.WITHDRAWAL:
        return "Withdrawals";
      case TransactionType.DEPOSIT:
        return "Deposits";
      case TransactionType.TROPHY_REWARD:
        return "Trophy Rewards";
      case TransactionType.TOP_REWARD:
        return "Top Rewards";
      default:
        return type;
    }
  }
}
