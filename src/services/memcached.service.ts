import { enumBot, startsWithSpecialChar } from "../ultis/constant";
import UserClanMessage from "../models/UserClanMessage";

interface MessageData {
  user_id: string;
  clan_id?: string;
  count: number;
  lastMessageText?: string;
  lastMessageAt?: number;
  lastCountedAt?: number;
}

export class DataStorageService {
  private cache: Map<string, MessageData>;

  constructor() {
    this.cache = new Map<string, MessageData>();
  }

  async publishMessage(message: any): Promise<void> {
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
      const key = `${clan_id}_${sender_id}`;

      const text: string = typeof content?.t === "string" ? content.t : "";
      const now = Date.now();

      if (this.getAsync(key)) {
        this.checkAndIncrementCount(sender_id, clan_id, text, now);
      } else {
        // Khởi tạo user mới với count = 1 (tin nhắn đầu tiên)
        await this.setAsync(key, {
          user_id: sender_id,
          clan_id,
          count: 1,
          lastMessageText: text,
          lastMessageAt: now,
          lastCountedAt: now,
        });
      }
    } catch (error) {
      console.error("Error processing count message:", error);
    }
  }

  private getAsync(key: string) {
    const entry = this.cache.get(key);
    if (!entry) {
      return;
    }
    return entry;
  }

  private async setAsync(key: string, data: MessageData): Promise<void> {
    this.cache.set(key, data);
  }

  async deleteData(key: string): Promise<void> {
    return new Promise((resolve) => {
      this.cache.delete(key);
      resolve();
    });
  }

  async checkAndIncrementCount(
    sender_id: string,
    clan_id: string,
    text: string,
    now: number
  ): Promise<any> {
    const storageKey = `${clan_id}_${sender_id}`;

    const SPAM_TIME_WINDOW_MS = 200;
    const DUPLICATE_WINDOW_MS = 10000;

    let data = (await this.getAsync(storageKey)) as MessageData;

    if (!data) return;

    const isDuplicateSpam =
      !!data.lastMessageText &&
      data.lastMessageText === text &&
      !!data.lastMessageAt &&
      now - data.lastMessageAt < DUPLICATE_WINDOW_MS;

    const isRateLimitedSpam =
      !!data.lastMessageAt && now - data.lastMessageAt < SPAM_TIME_WINDOW_MS;

    if (isDuplicateSpam || isRateLimitedSpam) {
      data.lastMessageText = text;
      data.lastMessageAt = now;
      await this.setAsync(storageKey, data);
      return;
    }

    data.lastMessageText = text;
    data.lastMessageAt = now;

    data.count += 1;
    data.lastCountedAt = now;
    await this.setAsync(storageKey, data);
  }

  async syncMessageCounts() {
    const allData = Array.from(this.cache.values());
    if (allData.length === 0) {
      return;
    }

    for (const data of allData) {
      if (!data.clan_id) continue;

      const [userClanMessage] = await UserClanMessage.findOrCreate({
        where: {
          user_id: data.user_id,
          clan_id: data.clan_id,
        },
        defaults: {
          user_id: data.user_id,
          clan_id: data.clan_id,
          countmessage: 0,
        },
      });

      userClanMessage.countmessage += data.count;
      await userClanMessage.save();
    }

    this.cache.clear();
  }
}

export const dataStorageService = new DataStorageService();

export const publishMessage =
  dataStorageService.publishMessage.bind(dataStorageService);

export const syncMessageCounts =
  dataStorageService.syncMessageCounts.bind(dataStorageService);
