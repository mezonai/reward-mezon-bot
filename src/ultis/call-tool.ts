import { ChannelMessage } from "mezon-sdk";
import { clientMCP } from "../config/connect";

export class RewardToolService {
  private client = clientMCP;

  async topDay() {
    return await clientMCP.callTool({
      name: "top-day",
      arguments: {
        date: new Date().toISOString().split("T")[0],
      },
    });
  }

  async topWeek() {
    return await this.client.callTool({
      name: "top-week",
      arguments: {
        date: new Date().toISOString().split("T")[0],
      },
    });
  }

  async topMonth() {
    return await this.client.callTool({
      name: "top-month",
      arguments: {
        date: new Date().toISOString().split("T")[0],
      },
    });
  }

  async rankReward(limit: number = 5) {
    return await this.client.callTool({
      name: "rank",
      arguments: {
        limit,
      },
    });
  }

  async awardTrophy(
    userId: string,
    rewardName: string,
    userName: string,
    sender_id: string
  ) {
    try {
      const result = await this.client.callTool({
        name: "award-user",
        arguments: {
          userId,
          rewardName,
          userName,
          sender_id,
        },
      });

      return result;
    } catch (err) {
      throw err;
    }
  }

  async trophyUser(userId: string) {
    return await this.client.callTool({
      name: "get-user-rewards",
      arguments: {
        userId,
      },
    });
  }
  async assignRoleOnScore(
    action: "new" | "upd" | "del",
    roleName: string,
    point_threshold: number
  ) {
    return await this.client.callTool({
      name: "assign-role-on-score",
      arguments: {
        role_name: roleName,
        point_threshold,
        action,
      },
    });
  }

  async listTrophy() {
    return await this.client.callTool({
      name: "list-trophy",
    });
  }
  async listRoleRewards() {
    return await clientMCP.callTool({
      name: "list-role-rewards",
    });
  }

  async crudTrophy(
    action: "del" | "upd" | "new",
    name: string,
    description: string,
    points: number,
    createdBy?: string
  ) {
    return await clientMCP.callTool({
      name: "crud-trophy",
      arguments: {
        name,
        description,
        points: points || 0,
        createdBy,
        action,
      },
    });
  }

  async askTool(
    message: ChannelMessage,
    question: string,
    historyMessage?: string[]
  ) {
    return await clientMCP.callTool({
      name: "ask-gemini",
      arguments: {
        clan_id: message?.id,
        channel_id: message?.channel_id,
        message_id: message?.message_id,
        question,
        message: historyMessage,
      },
    });
  }
}

export const rewardToolService = new RewardToolService();

export default RewardToolService;
