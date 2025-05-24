import { z } from "zod";

export const ReadMessagesSchema = z.object({
  channel_id: z.string().describe("channel id"),
  limit: z.number().min(1).max(100).default(50),
});

export const SendMessageSchema = z.object({
  channel_id: z.string().describe("channel id"),
  context: z.any().optional().default([]).describe("Context of the message"),
  question: z.string().describe("The question to ask Gemini"),
  type: z.string().optional().describe("Type of gemini"),
});

export const CrudRewardSchema = z.object({
  name: z.string().describe("Name of the reward"),
  description: z.string().optional().describe("Description of the reward"),
  points: z.number().optional().describe("Points of the reward"),
  createdBy: z.string().describe("User ID of the creator"),
  action: z.enum(["del", "upd", "new"]).describe("action to perform"),
});

export const AddUserRewardSchema = z.object({
  userId: z.string().describe("User ID to add the reward to"),
  rewardId: z.string().describe("Reward ID to add"),
  amount: z.number().describe("Amount of the reward to add"),
});

// New schema for awarding a trophy
export const AwardTrophySchema = z.object({
  userId: z.string().describe("User ID to award the trophy"),
  rewardName: z.string().describe("Name of the trophy to award"),
  userName: z.string().describe("Name of the user to award the trophy to"),
  sender_id: z.string().describe("User ID give trophy"),
});

// New schema for getting user trophies
export const GetUserTrophiesSchema = z.object({
  userId: z.string().describe("ID of the user to fetch trophies for"),
});
export const GetLeaderboardSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe("Number of top users to return"),
});

// New schema for assigning a role based on trophy score

export const AssignRoleOnScoreSchema = z.object({
  action: z.enum(["del", "upd", "new"]).describe("action to perform"),
  point_threshold: z.number().optional().describe("point threshold"),
  role_name: z.string().describe("role name"),
});

export const TopSchema = z.object({
  date: z.string().describe("Date to get the top week for"),
});

export const AddUserSchema = z.object({
  user_id: z.string().describe("User ID to add the reward to"),
  username: z.string().describe("Username of the user to add the reward to"),
  amount: z.number().describe("Amount of the reward to add"),
  countmessage: z.number().optional().describe("number message in clan"),
  message: z.string().optional().describe("message user send"),
});
