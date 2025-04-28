import { z } from "zod";

export const SendMessageSchema = z.object({
  server: z
    .string()
    .optional()
    .describe("Clan name or ID (optional if bot is only in one server)"),
  channel: z.string().describe('Channel name (e.g., "general") or ID'),
  message: z.string(),
});

export const ReadMessagesSchema = z.object({
  server: z
    .string()
    .optional()
    .describe("Clan name or ID (optional if bot is only in one server)"),
  channel: z.string().describe('Channel name (e.g., "general") or ID'),
  limit: z.number().min(1).max(100).default(50),
});

export const AskGeminiSchema = z.object({
  server: z
    .string()
    .optional()
    .describe("Clan name or ID (optional if bot is only in one server)"),
  channel: z.string().describe('Channel name (e.g., "general") or ID'),
  question: z.string().describe("The question to ask Gemini"),
  messages: z.any().describe("List of messages to use as context"),
});

export const CreateRewardSchema = z.object({
  name: z.string().describe("Name of the reward"),
  description: z.string().describe("Description of the reward"),
  icon: z.string().optional().describe("Icon of the reward"),
  value: z.number().describe("Value of the reward"),
});

export const AddUserRewardSchema = z.object({
  userId: z.string().describe("User ID to add the reward to"),
  rewardId: z.string().describe("Reward ID to add"),
  amount: z.number().describe("Amount of the reward to add"),
});
