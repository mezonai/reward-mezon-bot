import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  ReadMessagesFunctionDeclaration,
  SendMessageFunctionDeclaration,
} from "./gemini_schema";
import { content_gemini } from "./gemini_context";
dotenv.config();

class GeminiRewardService {
  private genAI: GoogleGenAI;
  constructor() {
    this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  async sendMessageAndGetResponse(
    question: string,
    context?: any[],
    channe_id?: string
  ) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return "GEMINI_API_KEY is not defined in .env file.";
      }

      const currentContents = await content_gemini(
        question,
        context,
        channe_id
      );

      if (currentContents.length > 51) {
        const systemPrompt = currentContents[0];
        const recentMessages = currentContents.slice(-50);
        currentContents.length = 0;
        currentContents.push(systemPrompt, ...recentMessages);
      }

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: currentContents,
        config: {
          tools: [
            { functionDeclarations: [SendMessageFunctionDeclaration] },
            { functionDeclarations: [ReadMessagesFunctionDeclaration] },
          ],
        },
      });

      const candidateContent = result?.candidates?.[0]?.content;
      const part = candidateContent?.parts?.[0];

      if (part?.functionCall) {
        const { name, args } = part.functionCall;

        switch (name) {
          case "read-message": {
            const { channel_id, limit } = args as {
              channel_id: string;
              limit: number;
            };

            let responseText = "Không thể đọc tin nhắn hoặc kênh trống.";

            try {
              const contextMessages = [];

              for (const content of currentContents) {
                if (content.role === "user" && content.parts?.[0]?.text) {
                  const text = content.parts[0].text;
                  const match = text.match(
                    /Từ người dùng (.*?) tại  ID channel (.*?) :(.*)/s
                  );
                  if (match) {
                    const [_, author, channelId, messageContent] = match;
                    contextMessages.push({
                      author,
                      sender_id: author,
                      channel_id: channelId.trim(),
                      content: messageContent.trim(),
                    });
                  }
                }
              }

              const messagesArray = contextMessages.slice(-limit);

              if (messagesArray.length > 0) {
                responseText = `Đã đọc được ${
                  messagesArray.length
                } tin nhắn:\n${JSON.stringify(messagesArray, null, 2)}`;
              }
            } catch (error) {
              responseText = "Lỗi khi xử lý dữ liệu tin nhắn.";
            }

            currentContents.push(
              { role: "model", parts: [{ functionCall: part.functionCall }] },
              {
                role: "function",
                parts: [
                  {
                    functionResponse: {
                      name,
                      response: { content: responseText },
                    },
                  },
                ],
              }
            );

            const secondResult = await this.genAI.models.generateContent({
              model: "gemini-2.0-flash-001",
              contents: currentContents,
              config: {
                tools: [
                  { functionDeclarations: [SendMessageFunctionDeclaration] },
                ],
              },
            });

            const secondPart =
              secondResult?.candidates?.[0]?.content?.parts?.[0];
            if ("text" in (secondPart || {})) {
              return secondPart?.text;
            }
            return "Không thể xử lý phản hồi sau khi đọc tin nhắn.";
          }

          case "send-message": {
            const { channel_id, question } = args as {
              channel_id: string;
              question: string;
            };

            currentContents.push(
              { role: "model", parts: [{ functionCall: part.functionCall }] },
              {
                role: "function",
                parts: [
                  {
                    functionResponse: {
                      name,
                      response: { content: question },
                    },
                  },
                ],
              }
            );

            const sendResult = await this.genAI.models.generateContent({
              model: "gemini-2.0-flash-001",
              contents: currentContents,
              config: {
                tools: [
                  { functionDeclarations: [SendMessageFunctionDeclaration] },
                ],
              },
            });

            return sendResult?.candidates?.[0]?.content?.parts?.[0]?.text;
          }

          default:
            return `Command "${name}" không được hỗ trợ.`;
        }
      }

      if (part?.text) {
        return part.text;
      }

      return "Bot không thể tạo phản hồi.";
    } catch (err) {
      return err instanceof Error
        ? `Đã xảy ra lỗi: ${err.message}`
        : "Lỗi không xác định.";
    }
  }
}

export const geminiRewardService = new GeminiRewardService();
