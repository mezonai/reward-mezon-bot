import { ContentListUnion } from "@google/genai";
import { ChannelMessage } from "mezon-sdk";

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
  question?: string,
  context?: any,
  channe_id?: string
): Promise<ContentListUnion> {
  const systemPrompt = `Bạn là một trợ lý ảo tên **Bot Reward** hoạt động trong các kênh chat có id là ${channe_id} 
  Vai trò của bạn bao gồm:
  - Tóm tắt hoặc hiểu nội dung tin nhắn trước đó.
  - Trả lời tin nhắn của người dùng một cách tự nhiên và phù hợp ngữ cảnh.
  Lưu ý:
  - channel_id là ${channe_id} của kênh chat. và limit tối đa là 50 tin nhắn.
  - Nếu được yêu cầu gọi công cụ read-message, bạn cần phản hồi tiếp sau khi đã nhận được nội dung.
  Hãy phản hồi như một trợ lý AI thông minh và hiểu ngữ cảnh tốt.`;

  let currentContents: Content[] = [
    {
      role: "model",
      parts: [{ text: systemPrompt }],
    },
  ];

  if (Array.isArray(context) || channe_id) {
    for (const msg of context) {
      const text =
        typeof msg.content === "object" ? msg.content.t : msg.content;
      const role = msg.author === process.env.BOT ? "model" : "user";
      const fullText = `Từ người dùng ${
        msg.author || channe_id
      } tại  ID channel ${msg.channel_id || channe_id} :\n${text}`;
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
