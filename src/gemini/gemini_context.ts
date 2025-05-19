import { ContentListUnion } from "@google/genai";
import {
  ReadMessageFunctionDeclaration,
  SendMessageFunctionDeclaration,
} from "./gemini_schema";

interface Message {
  author: string;
  channel: string;
  channel_id: string;
  server: string;
  content: string | { t: string };
}

interface FunctionCall {
  name: string;
  args: any;
}

interface FunctionResponse {
  name: string;
  response: {
    content: string;
  };
}

interface ContentPart {
  text?: string;
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
}

interface Content {
  role: string;
  parts: ContentPart[];
}
export async function content_gemini(
  question: string,
  context?: any
): Promise<ContentListUnion> {
  const systemPrompt = `Bạn là một trợ lý ảo tên **Bot Reward** hoạt động trong các kênh chat.
  Vai trò của bạn bao gồm:
  - Tóm tắt hoặc hiểu nội dung tin nhắn trước đó.
  - Trả lời tin nhắn của người dùng một cách tự nhiên và phù hợp ngữ cảnh.
  - Khi cần phản hồi tin nhắn, bạn **phải sử dụng đúng message_id và channel_id**
  - Bạn có quyền đọc các tin nhắn gần đây trong kênh nếu cần để đưa ra phản hồi chính xác hơn.
  Lưu ý:
  - Tin nhắn sẽ có định dạng bao gồm: tên người gửi, tên kênh, ID kênh và tên clan.
  - Nếu được yêu cầu gọi công cụ read-message, bạn cần phản hồi tiếp sau khi đã nhận được nội dung.
  - Luôn đảm bảo nội dung bạn gửi lại thân thiện, dễ hiểu, không máy móc.
  Hãy phản hồi như một trợ lý AI thông minh và hiểu ngữ cảnh tốt.`;

  let currentContents: Content[] = [
    {
      role: "model",
      parts: [{ text: systemPrompt }],
    },
  ];

  if (Array.isArray(context)) {
    for (const msg of context) {
      const text =
        typeof msg.content === "object" ? msg.content.t : msg.content;
      const role = msg.author === process.env.BOT ? "model" : "user";
      const fullText = `Từ người dùng ${msg.author} tại kênh ${msg.channel}  ID kênh ${msg.channel_id} trên server ${msg.server}:\n${text}`;
      currentContents.push({
        role: role,
        parts: [{ text: fullText }],
      });
    }
  }

  if (question) {
    currentContents.push({
      role: "user",
      parts: [{ text: question }],
    });
  }

  return currentContents;
}
