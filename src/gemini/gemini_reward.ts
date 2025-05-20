import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  ReadMessagesFunctionDeclaration,
  SendMessageFunctionDeclaration,
} from "./gemini_schema";
import { content_gemini } from "./gemini_context";
import { rewardToolService } from "../ultis/call-tool";
import { sendMessage } from "../ultis/message";
dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function sendMessageAndGetResponse(
  question: string,
  context?: any[],
  channe_id?: string
) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return "GEMINI_API_KEY is not defined in .env file. Please check your environment variables.";
    }

    const content = await content_gemini(question, context, channe_id);

    // console.error("content", JSON.stringify(content, null, 2));
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: content,
      config: {
        tools: [
          { functionDeclarations: [SendMessageFunctionDeclaration] },
          { functionDeclarations: [ReadMessagesFunctionDeclaration] },
        ],
      },
    });

    console.error("content ", JSON.stringify(content, null, 2));

    console.error("result ", JSON.stringify(result, null, 2));

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content
    ) {
      const candidate = result.candidates[0];
      const candidateContent = candidate.content;
      console.error("candidateContent", candidateContent);

      if (
        candidateContent &&
        candidateContent.parts &&
        candidateContent.parts[0] &&
        candidateContent.parts[0].functionCall
      ) {
        const functionCall = candidateContent.parts[0].functionCall;

        const { name, args } = functionCall;
        switch (name) {
          case "send-message": {
            console.log("sendMessage", args);
          }
          case "read-messages": {
            console.log("readMessages", args);
            console.log(
              "functionCall ",
              JSON.stringify(candidateContent.parts[0].functionCall, null, 2)
            );
          }
          case "read-message": {
            const { channel_id, limit } = args as {
              channel_id: string;
              limit: number;
            };
            const readResult = await rewardToolService.readMessage(
              channel_id,
              limit
            );
            let responseText = "Không thể đọc tin nhắn hoặc kênh trống.";

            if (readResult && typeof readResult === "object") {
              try {
                if (
                  readResult.content &&
                  Array.isArray(readResult.content) &&
                  readResult.content[0]?.text
                ) {
                  const messagesArray = JSON.parse(readResult.content[0].text);
                  responseText = `Đã đọc được ${
                    messagesArray.length
                  } tin nhắn:\n${JSON.stringify(messagesArray, null, 2)}`;
                }
              } catch (error) {
                responseText = "Lỗi khi xử lý dữ liệu tin nhắn đọc được.";
              }
            }

            const currentContents = [];
            currentContents.push({
              role: "model",
              parts: [
                {
                  functionCall: {
                    name: functionCall.name || "",
                    args: functionCall.args || {},
                  },
                },
              ],
            });
            currentContents.push({
              role: "function",
              parts: [
                {
                  functionResponse: {
                    name: "read-message",
                    response: { content: responseText },
                  },
                },
              ],
            });

            const secondResult = await genAI.models.generateContent({
              model: "gemini-2.0-flash-001",
              contents: currentContents,
              config: {
                tools: [
                  { functionDeclarations: [SendMessageFunctionDeclaration] },
                ],
              },
            });

            if (
              secondResult.functionCalls &&
              secondResult.functionCalls.length > 0
            ) {
              const secondFunctionCall = secondResult.functionCalls[0];

              console.log(
                "secondFunctionCall",
                JSON.stringify(secondFunctionCall, null, 2)
              );
              if (secondFunctionCall.name === "send-message") {
                const { server, channel, message } =
                  secondFunctionCall.args as any;
                // await sendMessage(channel, message, server);
                return "send-message";
              }
            } else if (secondResult.text) {
              return secondResult.text;
            }

            return "Không thể xử lý phản hồi sau khi đọc tin nhắn.";
          }

          default: {
            return `command ${name} not supported.`;
          }
        }
      } else if (
        candidateContent &&
        candidateContent.parts &&
        candidateContent.parts[0] &&
        "text" in candidateContent.parts[0] &&
        candidateContent.parts[0].text
      ) {
        return candidateContent.parts[0].text;
      }
    }

    return "Bot không thể tạo phản hồi.";
  } catch (err) {
    console.error("Lỗi trong sendMessageAndGetResponse:", err);
    if (err instanceof Error) {
      return `Đã xảy ra lỗi: ${err.message}`;
    }
    return "Đã xảy ra lỗi không xác định khi xử lý yêu cầu của bạn.";
  }
}
