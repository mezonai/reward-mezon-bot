import { z } from "zod";
import { findChannel } from "../config/mezon-client";
import {
  AskGeminiSchema,
  CreateRewardSchema,
  ReadMessagesSchema,
  SendMessageSchema,
} from "./schema/tool_schema";

export const CallTools = async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "send-message": {
        const {
          server: serverId,
          channel: channelId,
          message,
        } = SendMessageSchema.parse(args);
        const channel = await findChannel(channelId, serverId);

        const sent = await channel.send({ t: message });

        console.error("Sent message:", sent);
        return {
          content: [
            {
              type: "text",
              text: `Message sent successfully to #${channel.name} in ${channel.clan.name}. Message ID: ${sent.message_id}`,
            },
          ],
        };
      }

      case "read-messages": {
        const {
          server: serverId,
          channel: channelId,
          limit,
        } = ReadMessagesSchema.parse(args);
        const channel = await findChannel(channelId, serverId);

        const messages = channel.messages.values();

        const formattedMessages = Array.from(messages).map((msg) => ({
          channel: `${channel.name}`,
          server: channel.clan.name,
          author: msg.sender_id,
          content: msg.content,
          channel_id: channel.id,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formattedMessages, null, 2),
            },
          ],
        };
      }

      case "ask-gemini": {
        const {
          server: serverId,
          channel: channelId,
          question,
          messages,
        } = AskGeminiSchema.parse(args);

        const channelMessages = messages.slice(0, -1);
        console.error("Formatted messages:", channelMessages);
        // const response = await sendMessageAndGetResponse(
        //   question,
        //   channelMessages
        // );

        return {
          content: [
            {
              type: "text",
              text: "response",
            },
          ],
        };
      }

      case "create-trophy": {
        const { name, description, icon, value } =
          CreateRewardSchema.parse(args);



          

        return {
          content: [
            {
              type: "text",
              text: "response",
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }
    throw error;
  }
};
