import { MezonClient } from "mezon-sdk";

export class MezonClientService {
  private client: MezonClient;

  constructor(token: string) {
    this.client = new MezonClient(token);
  }

  async initializeClient() {
    try {
      return await this.client.login();
    } catch (error) {
      throw error;
    }
  }

  getClient() {
    return this.client;
  }
}
