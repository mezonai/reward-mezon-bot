import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  ReadMessageFunctionDeclaration,
  SendMessageFunctionDeclaration,
} from "./gemini_schema";
import { content_gemini } from "./gemini_context";
import { formatMessage } from "../ultis/constant";
import { replyMessage } from "../ultis/message";
dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function sendMessageAndGetResponse(
  channe_id: string,
  message_id: string,
  question: string,
  context?: any
) {
  try {
    const content = await content_gemini(question, context);
    console.error("content_gemini", JSON.stringify(content));
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: content,
      config: {
        tools: [
          { functionDeclarations: [SendMessageFunctionDeclaration] },
          // { functionDeclarations: [ReadMessageFunctionDeclaration] },
        ],
      },
    });

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content
    ) {
      const candidate = result.candidates[0];
      const candidateContent = candidate.content;

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
            const { message_id, channel, message } = args as {
              message_id: string;
              channel: string;
              message: string;
            };

            //   await sendMessage(channel, message, message_id);
          }

          // case "read-message": {
          //   const { message_id, channel, limit } = args as {
          //     message_id: string;
          //     channel: string;
          //     limit: number;
          //   };

          //   const readResult = await readMessages(channel, limit, server);
          //   let responseText = "Không thể đọc tin nhắn hoặc kênh trống.";

          //   if (readResult && typeof readResult === "object") {
          //     try {
          //       if (
          //         readResult.content &&
          //         Array.isArray(readResult.content) &&
          //         readResult.content[0]?.text
          //       ) {
          //         const messagesArray = JSON.parse(readResult.content[0].text);
          //         responseText = `Đã đọc được ${
          //           messagesArray.length
          //         } tin nhắn:\n${JSON.stringify(messagesArray, null, 2)}`;
          //       }
          //     } catch (error) {
          //       responseText = "Lỗi khi xử lý dữ liệu tin nhắn đọc được.";
          //     }
          //   }

          //   currentContents.push({
          //     role: "model",
          //     parts: [
          //       {
          //         functionCall: {
          //           name: functionCall.name || "",
          //           args: functionCall.args || {},
          //         },
          //       },
          //     ],
          //   });
          //   currentContents.push({
          //     role: "function",
          //     parts: [
          //       {
          //         functionResponse: {
          //           name: "read-message",
          //           response: { content: responseText },
          //         },
          //       },
          //     ],
          //   });

          //   const secondResult = await genAI.models.generateContent({
          //     model: "gemini-2.0-flash-001",
          //     contents: currentContents,
          //     config: {
          //       tools: [
          //         { functionDeclarations: [SendMessageFunctionDeclaration] },
          //       ],
          //     },
          //   });

          //   if (
          //     secondResult.functionCalls &&
          //     secondResult.functionCalls.length > 0
          //   ) {
          //     const secondFunctionCall = secondResult.functionCalls[0];
          //     if (secondFunctionCall.name === "send-message") {
          //       const { server, channel, message } =
          //         secondFunctionCall.args as any;
          //       await sendMessage(channel, message, server);
          //       return "send-message";
          //     }
          //   } else if (secondResult.text) {
          //     return secondResult.text;
          //   }

          //   return "Không thể xử lý phản hồi sau khi đọc tin nhắn.";
          // }

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
        await replyMessage(
          channe_id,
          candidateContent.parts[0].text,
          message_id
        );
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
