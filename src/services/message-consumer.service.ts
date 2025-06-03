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
      const { username, sender_id, content, clan_id } = message;
      if (
        !sender_id ||
        username === "Anonymous" ||
        enumBot.some((bot) => username.includes(bot)) ||
        startsWithSpecialChar(content?.t) ||
        sender_id === process.env.BOT
      ) {
        return;
      }
      await this.storage.checkAndIncrementCount(sender_id, clan_id);
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
        let messageCount = 0;
        let clanStorageData = null;
        if (user.clan_id) {
          const clanStorageKey = `${user.user_id}_${user.clan_id}`;
          clanStorageData = await this.storage.getData(clanStorageKey);

          if (clanStorageData) {
            messageCount += Number(clanStorageData.count) || 0;
            await this.storage.deleteData(clanStorageKey);
          }
        }
        if (storageData) {
          messageCount += Number(storageData.count) || 0;
          await this.storage.deleteData(user.user_id);
        }

        if (messageCount > 0) {
          await user.update({
            countmessage: Number(user.countmessage) + messageCount,
          });
        }
      }
    } catch (error) {
      console.error("Error synchronizing message counts:", error);
      throw error;
    }
  }
}

export const messageConsumer = new MessageConsumerService();
