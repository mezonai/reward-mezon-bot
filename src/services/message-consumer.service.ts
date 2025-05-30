import { dataStorageService } from "./memcached.service";
import User from "../models/User";
import { enumBot, startsWithSpecialChar } from "../ultis/constant";

export class MessageConsumerService {
  private storage = dataStorageService;

  async start() {
    await this.storage.consumeMessages(async (message) => {
      await this.processMessage(message);
    });
  }

  async processMessage(message: any) {
    try {
      const { username, sender_id, content } = message;
      if (
        !sender_id ||
        username === "Anonymous" ||
        enumBot.some((bot) => username.includes(bot)) ||
        startsWithSpecialChar(content?.t) ||
        sender_id === process.env.BOT
      ) {
        return;
      }
      await this.storage.checkAndIncrementCount(sender_id);
    } catch (error) {
      console.error("Error processing message:", error);
      throw error;
    }
  }

  async syncMessageCounts() {
    try {
      const users = await User.findAll();
      for (const user of users) {
        const storageData = await this.storage.getData(user.user_id);
        if (storageData) {
          await user.update({
            countmessage:
              Number(storageData.count) + Number(user.countmessage) ||
              user.countmessage,
          });
          await this.storage.deleteData(user.user_id);
        }
      }
    } catch (error) {
      console.error("Error synchronizing message counts:", error);
      throw error;
    }
  }
}

export const messageConsumer = new MessageConsumerService();
