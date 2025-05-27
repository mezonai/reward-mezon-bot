import { createClient } from "redis";
import { configRedis } from "../config/redis.config";

export class RedisService {
  private clientRedis;

  constructor() {
    this.clientRedis = createClient({
      url: configRedis.redis.url,
    });

    this.clientRedis.on("error", (err) =>
      console.error("Redis Client Error:", err)
    );
    this.clientRedis.on("connect", () => console.log("Connected to Redis"));
  }

  async connect() {
    await this.clientRedis.connect();
  }

  async incrementCount(key: string): Promise<number> {
    return await this.clientRedis.incr(key);
  }

  async getCount(key: string): Promise<number> {
    const count = await this.clientRedis.get(key);
    return count ? parseInt(count) : 0;
  }

  async setData(key: string, data: any, expirySeconds?: number): Promise<void> {
    const value = JSON.stringify(data);
    if (expirySeconds) {
      await this.clientRedis.setEx(key, expirySeconds, value);
    } else {
      await this.clientRedis.set(key, value);
    }
  }

  async getData(key: string): Promise<any> {
    const data = await this.clientRedis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async getAllKeys(pattern: string): Promise<string[]> {
    return await this.clientRedis.keys(pattern);
  }

  async deleteData(key: string): Promise<void> {
    await this.clientRedis.del(key);
  }

  async checkAndIncrementCount(key: string): Promise<any> {
    const exists = await this.clientRedis.exists(key);
    if (exists) {
      const data = await this.getData(key);
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

  async close() {
    await this.clientRedis.quit();
  }
}

export const redisService = new RedisService();

export const connectRedis = redisService.connect.bind(redisService);
export const incrementCount = redisService.incrementCount.bind(redisService);
export const getCount = redisService.getCount.bind(redisService);
export const setData = redisService.setData.bind(redisService);
export const getData = redisService.getData.bind(redisService);
export const deleteData = redisService.deleteData.bind(redisService);
export const checkAndIncrementCount =
  redisService.checkAndIncrementCount.bind(redisService);
export const closeRedis = redisService.close.bind(redisService);
