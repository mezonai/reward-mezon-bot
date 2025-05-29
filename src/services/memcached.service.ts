interface QueueMessage {
  message: any;
  timestamp: number;
}

interface CacheEntry {
  value: any;
  expiryTime: number;
}

export class DataStorageService {
  private static instance: DataStorageService;
  private cache: Map<string, CacheEntry>;
  private readonly queueKey = "message_queue";
  private readonly messageExpiry = 7 * 24 * 60 * 60;
  private readonly dataExpiry = 30 * 24 * 60 * 60;

  private constructor() {
    this.cache = new Map<string, CacheEntry>();
  }

  public static getInstance(): DataStorageService {
    if (!DataStorageService.instance) {
      DataStorageService.instance = new DataStorageService();
    }
    return DataStorageService.instance;
  }

  async publishMessage(message: any): Promise<void> {
    const queue = await this.getAsync(this.queueKey);
    const messageQueue: QueueMessage[] = queue ? JSON.parse(queue) : [];
    messageQueue.push({
      message,
      timestamp: Date.now(),
    });

    await this.setAsync(
      this.queueKey,
      JSON.stringify(messageQueue),
      this.messageExpiry
    );
  }

  async consumeMessages(
    callback: (message: any) => Promise<void>
  ): Promise<void> {
    const processQueue = async () => {
      try {
        const queue: any = await this.getAsync(this.queueKey);
        if (queue) {
          const messageQueue = JSON.parse(queue);
          if (messageQueue.length > 0) {
            const { message } = messageQueue.shift();
            await callback(message);
            await this.setAsync(
              this.queueKey,
              JSON.stringify(messageQueue),
              this.messageExpiry
            );
          }
        }
      } catch (error) {
        console.error("Error processing message queue:", error);
      }

      setTimeout(processQueue, 100);
    };

    processQueue();
  }

  private getAsync(key: string): Promise<any> {
    return new Promise((resolve) => {
      const entry = this.cache.get(key);
      if (!entry) {
        resolve(null);
        return;
      }

      if (entry.expiryTime < Date.now()) {
        this.cache.delete(key);
        resolve(null);
        return;
      }

      resolve(entry.value);
    });
  }

  private setAsync(key: string, value: string, expiry: number): Promise<void> {
    return new Promise((resolve) => {
      const expiryTime = Date.now() + expiry * 1000;
      this.cache.set(key, { value, expiryTime });
      resolve();
    });
  }

  async incrementCount(key: string): Promise<number> {
    const currentValue = await this.getAsync(key);
    const newValue = currentValue ? parseInt(currentValue as string) + 1 : 1;
    await this.setAsync(key, newValue.toString(), this.dataExpiry);
    return newValue;
  }

  async getCount(key: string): Promise<number> {
    const count = await this.getAsync(key);
    return count ? parseInt(count as string) : 0;
  }

  async setData(
    key: string,
    data: any,
    expirySeconds: number = this.dataExpiry
  ): Promise<void> {
    await this.setAsync(key, JSON.stringify(data), expirySeconds);
  }

  async getData(key: string): Promise<any> {
    const data = await this.getAsync(key);
    return data ? JSON.parse(data as string) : null;
  }

  async deleteData(key: string): Promise<void> {
    return new Promise((resolve) => {
      this.cache.delete(key);
      resolve();
    });
  }

  async checkAndIncrementCount(key: string): Promise<any> {
    const data = await this.getData(key);
    if (data) {
      data.count = (data.count || 0) + 1;
      await this.setData(key, data);
      return data;
    } else {
      const newData = {
        user_id: key,
        count: 1,
      };
      await this.setData(key, newData);
      return newData;
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.cache.clear();
      resolve();
    });
  }
}

export const dataStorageService = DataStorageService.getInstance();
export const connect = async () => {};
export const publishMessage = async (message: any) => {
  await dataStorageService.publishMessage(message);
};
