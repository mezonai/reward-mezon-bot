import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  ReadMessagesFunctionDeclaration,
  SendMessageFunctionDeclaration,
} from "./gemini_schema";
import { content_gemini } from "./gemini_context";
import { rewardToolService } from "../ultis/call-tool";
import { sendMessage } from "../ultis/message";
import { clientMCP, connectClient } from "../config/connect";
dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function sendMessageAndGetResponse(
  question: string,
  context?: any[],
  channe_id?: string
) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return "GEMINI_API_KEY is not defined in .env file.";
    }

    const currentContents = await content_gemini(question, context, channe_id);

    const result = await genAI.models.generateContent({
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

          // Ensure connection before calling tool
          await connectClient();

          const readResult = await clientMCP.callTool({
            name: "read-message",
            arguments: {
              channel_id,
              limit,
            },
          });

          let responseText = "Không thể đọc tin nhắn hoặc kênh trống.";
          try {
            const content =
              (readResult?.content as Array<{ text: string }>) || [];
            const messagesArray = JSON.parse(content[0]?.text || "[]");
            if (messagesArray.length > 0) {
              responseText = `Đã đọc được ${
                messagesArray.length
              } tin nhắn:\n${JSON.stringify(messagesArray, null, 2)}`;
            }
          } catch {
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

          console.error("currentContents", currentContents);

          const secondResult = await genAI.models.generateContent({
            model: "gemini-2.0-flash-001",
            contents: currentContents,
            config: {
              tools: [
                { functionDeclarations: [SendMessageFunctionDeclaration] },
              ],
            },
          });

          const secondPart = secondResult?.candidates?.[0]?.content?.parts?.[0];

          console.error("secondPass", secondPart);

          if (secondPart?.functionCall?.name === "send-message") {
            const { channel, message } = secondPart.functionCall.args as {
              channel: string;
              message: string;
              server: string;
            };

            console.error("channel");

            return `Đã gửi tin nhắn: "${message}" tới kênh ${channel}`;
          }

          if ("text" in (secondPart || {})) {
            return secondPart?.text;
          }

          return "Không thể xử lý phản hồi sau khi đọc tin nhắn.";
        }

        case "send-message": {
          const { channel, message } = args as {
            channel: string;
            message: string;
            server: string;
          };

          return `Đã gửi tin nhắn: "${message}" tới kênh ${channel}`;
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
    console.error("Lỗi trong sendMessageAndGetResponse:", err);
    return err instanceof Error
      ? `Đã xảy ra lỗi: ${err.message}`
      : "Lỗi không xác định.";
  }
}
