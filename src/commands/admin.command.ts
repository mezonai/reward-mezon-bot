import { ChannelMessage } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { replyMessage } from "../services/message.service";
import { checkAnonymous } from "../ultis/constant";
import { adminService } from "../services/admin.service";
import User from "../models/User";

export class AdminCommand extends CommandMessage {
  async execute(args: string[], message: ChannelMessage, commandName?: string) {
    try {
      if (checkAnonymous(message.username!)) {
        await replyMessage(
          message.channel_id,
          "You must mention a valid member or provide a valid user ID or user not found!",
          message?.message_id!
        );
        return;
      }

      if (message.sender_id !== "1840678415796015104") {
        await replyMessage(
          message.channel_id,
          "You are not authorized to use this command.",
          message?.message_id!
        );
        return;
      }

      if (args[0] === "up" && args[1] && args[2]) {
        const user_id = args[1];
        const amount = parseFloat(args[2]);

        if (isNaN(amount)) {
          await replyMessage(
            message.channel_id,
            "Invalid amount. Please provide a valid number.",
            message?.message_id!
          );
          return;
        }

        try {
          const result = await adminService.updateUserAmount(
            user_id,
            amount,
            "Admin command update"
          );

          return await replyMessage(
            message.channel_id,
            `✅ Successfully updated user amount!\n\n**User ID:** ${user_id}\n**Old Amount:** ${
              result.oldAmount
            }\n**New Amount:** ${result.newAmount}\n**Difference:** ${
              result.difference > 0 ? "+" : ""
            }${result.difference}`,
            message?.message_id!
          );
        } catch (error) {
          console.error("Error updating user amount:", error);
        }
      }

      if (args[0] === "down" && args[1] && args[2]) {
        const user_id = args[1];
        const amount = parseFloat(args[2]);

        if (isNaN(amount)) {
          await replyMessage(
            message.channel_id,
            "Invalid amount. Please provide a valid number.",
            message?.message_id!
          );
          return;
        }

        try {
          const result = await adminService.decreaseUserAmount(
            user_id,
            amount,
            "Admin command down"
          );

          return await replyMessage(
            message.channel_id,
            `✅ Successfully updated user amount!\n\n**User ID:** ${user_id}\n**Old Amount:** ${result.oldAmount}\n**New Amount:** ${result.newAmount}`,
            message?.message_id!
          );
        } catch (error) {
          console.error("Error updating user amount:", error);
        }
      }

      if (args[0] === "check" && args[1]) {
        const user_id = args[1];
        const user = await User.findOne({ where: { user_id } });
        if (!user) {
          await replyMessage(
            message.channel_id,
            "User not found.",
            message?.message_id!
          );
          return;
        }

        return await replyMessage(
          message.channel_id,
          `User ID: ${user_id}\nUsername: ${user.username}\nAmount: ${user.amount}`,
          message?.message_id!
        );
      }
    } catch (error) {
      console.log("admin command error", error);
    }
  }
}
