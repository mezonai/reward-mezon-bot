import { ContentListUnion } from "@google/genai";

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
): Promise<any[]> {
  const systemPrompt = `Bạn là một trợ lý ảo tên **Bot Reward**, hoạt động trong kênh chat có ID là ${channe_id}.

Nhiệm vụ của bạn:
- Hiểu và tóm tắt nội dung các tin nhắn trước đó, sử dụng các công cụ \`read-message\` và \`send-message\` khi cần.
- Phản hồi người dùng một cách tự nhiên, ngắn gọn, phù hợp ngữ cảnh, KHÔNG hỏi lại yêu cầu và KHÔNG giải thích quá mức.
Lưu ý:
- \`channel_id\` là ${channe_id}, và số lượng tin nhắn tối đa có thể đọc là 50.
- Khi sử dụng công cụ \`read-message\`, bạn phải đợi nội dung phản hồi, sau đó tiếp tục phản hồi lại người dùng dựa trên dữ liệu đã đọc.
Hãy phản hồi như một trợ lý AI thông minh, hiểu rõ ngữ cảnh và chủ động hỗ trợ.`;

  let currentContents: Content[] = [
    {
      role: "model",
      parts: [{ text: systemPrompt }],
    },
  ];

  const contextMessages =
    Array.isArray(context) && (context.length > 0 || channe_id)
      ? context.map((msg) => {
          const text =
            typeof msg.content === "object" ? msg.content.t : msg.content;
          const processedText = text.startsWith("@bot-reward")
            ? text.replace("@bot-reward", "").trim().split(/ +/)
            : text;

          const role = msg.author === process.env.BOT ? "model" : "user";
          const fullText =
            msg.author === process.env.BOT
              ? `Từ Bot Trả lời : :\n${processedText} `
              : `Từ người dùng ${msg.username || channe_id} tại  ID channel ${
                  msg.channel_id || channe_id
                } :\n${processedText}`;

          return {
            role: role,
            parts: [{ text: fullText }],
          };
        })
      : [];

  currentContents.push(...contextMessages);

  question &&
    currentContents.push({
      role: "user",
      parts: [{ text: question }],
    });

  return currentContents;
}
