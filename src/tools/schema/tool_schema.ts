import { create } from "domain";
import { z } from "zod";

export const SendMessageSchema = z.object({
  server: z
    .string()
    .optional()
    .describe("Clan name or ID (optional if bot is only in one server)"),
  channel: z.string().describe('Channel name (e.g., "general") or ID'),
  message: z.union([
    z.string(),
    z.object({
      t: z.string(),
      ui: z.object({
        fields: z.array(
          z.object({
            name: z.string(),
            label: z.string(),
            type: z.string(),
            optional: z.boolean().optional(),
          })
        ),
        tool_call: z.string(),
      }),
    }),
  ]),
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
  points: z.number().describe("Points of the reward"),
  createdBy: z.string().describe("User ID of the creator"),
});

export const AddUserRewardSchema = z.object({
  userId: z.string().describe("User ID to add the reward to"),
  rewardId: z.string().describe("Reward ID to add"),
  amount: z.number().describe("Amount of the reward to add"),
});

// New schema for awarding a trophy
export const AwardTrophySchema = z.object({
  userId: z.string().describe("Target user ID to award the trophy"),
  rewardName: z.string().describe("Name of the trophy to award"),
  userName: z.string().describe("Name of the user to award the trophy to"),
});

// New schema for assigning a role based on trophy score
export const AssignRoleOnScoreSchema = z.object({
  roleId: z.string().describe("Role ID to assign"),
  scoreThreshold: z
    .number()
    .describe("Minimum score required to assign the role"),
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
