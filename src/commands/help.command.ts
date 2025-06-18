import { ChannelMessage } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { replyMessage } from "../services/message.service";
import { checkAnonymous } from "../ultis/constant";

export class HelpCommand extends CommandMessage {
  async execute(args: string[], message: ChannelMessage) {
    if (checkAnonymous(message.username!)) {
      await replyMessage(
        message.channel_id,
        "You must mention a valid member or provide a valid user ID or user not found!",
        message?.message_id!
      );
      return;
    }
    const helpText = `
              🏆 **Reward - Help Menu:** 👑
       
      !help - Display command list
      !trophy new  - Create new trophy 
      !trophy upd | trophy name - Update trophy
      !trophy del | trophy name - Delete trophy
      !list_trophy - View trophy list
      !award @user | Trophy Name - (Award trophy to user)
      !rank  or !rank number - View reward leaderboard 
      !trophies or !trophies user - View trophy list of a user or yourself
      !list - View role rewards list 
      !reward del | role name - Delete role reward (only admin)
      !reward new - Create role reward (only admin)
      !reward upd | role name  - Update role reward (only admin)
      !top - View leaderboard of active members today
      !top_week - View trophy leaderboard this week
      !top_month - View trophy leaderboard this month
      !kttk - Check account
      !rut - Withdraw money
      @bot-reward - Ask bot about content in channel or create images 
      
      - Note: To create images, you need to include one of the following words: "create image", 
        "generate image", "create photo", "draw image"

            `;
    await replyMessage(message?.channel_id!, helpText, message?.message_id!);
  }
}
