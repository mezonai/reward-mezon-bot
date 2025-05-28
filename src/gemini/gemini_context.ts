import { FunctionCall as GenAIFunctionCall } from "@google/genai";
import User from "../models/User";
import https from "https";
interface Message {
  author: string;
  channel: string;
  channel_id: string;
  server: string;
  content: string;
  sender_id: string;
  channel_name: string;
}

interface FunctionCall {
  name: string | undefined;
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
  functionCall?: GenAIFunctionCall;
  functionResponse?: FunctionResponse;
}

interface Content {
  role: string;
  parts: ContentPart[];
}

export async function content_gemini(
  question?: string,
  context: Message[] = [],
  channe_id?: string
): Promise<Content[]> {
  const systemPrompt = `Bạn là một trợ lý ảo tên Bot Reward, hoạt động trong kênh chat có \`channel_id\` là ${channe_id}.
Nhiệm vụ của bạn:
- Hiểu và sử dụng được nhiều ngôn ngữ.
- Khi người dùng yêu cầu tóm tắt, chỉ tóm tắt các nội dung liên quan đến yêu cầu của họ. Không tự ý tóm tắt nếu không rõ mục tiêu.
- Sử dụng công cụ \`read-message\` để lấy bối cảnh khi cần thiết. Sau khi nhận được kết quả, tiếp tục phản hồi người dùng mà không hỏi xin phép.
- Phản hồi một cách tự nhiên, ngắn gọn, đúng chủ đề và phù hợp với ngữ cảnh không hiện thị ra \`channel_id\` .
Quy tắc định dạng:
-Khi người dùng yêu cầu tóm tắt thì hãy gọi lại công cụ \`read-message\` để lấy bối cảnh.
- Khi trả lời có chứa đoạn code được định dạng bằng dấu \`\`\`, hãy loại bỏ các dấu \`\`\` đó trước khi gửi.
- Hạn chế sử dụng các ký hiệu định dạng như dấu * hoặc ** nếu không thực sự cần thiết.
- Có thể sử dụng emoji để tăng tính biểu cảm nếu phù hợp.
Thông tin khác:
- Bạn có quyền truy cập thời gian hiện tại.
- \`channel_id\` là ${channe_id}, số lượng tin nhắn có thể đọc tối đa là 50.`;

  let currentContents: Content[] = [
    {
      role: "model",
      parts: [{ text: systemPrompt }],
    },
  ];

  const allUser = await User.findAll();

  if (!Array.isArray(context) || context.length === 0) {
    if (question) {
      currentContents.push({
        role: "user",
        parts: [{ text: question }],
      });
    }
    return currentContents;
  }

  const customContext = context.map((msg: Message) => {
    const user = allUser.find((user) => user.user_id === msg.sender_id);

    return {
      author: msg?.sender_id,
      content: msg.content,
      channel_id: msg.channel_id,
      channel_name: msg.channel_name,
      username: user?.username || "Anonymous",
    };
  });

  const contextMessages = customContext.map((msg: any) => {
    const text = msg.content;
    const processedText = text.startsWith("@bot-reward")
      ? text.replace("@bot-reward", "").trim().split(/ +/)
      : text;

    const botId = process.env.BOT as string;
    const role = msg.author === botId ? "model" : "user";
    const fullText =
      msg.author === botId
        ? `${processedText} `
        : `Từ người dùng ${msg.username} tại  ID channel ${
            msg.channel_id || channe_id
          } :\n${processedText}`;

    return {
      role: role,
      parts: [{ text: fullText }],
    };
  });

  currentContents.push(...contextMessages);

  if (question) {
    currentContents.push({
      role: "user",
      parts: [{ text: question }],
    });
  }

  return currentContents;
}

export const context_gemini_bug = [
  {
    role: "user",
    parts: [
      {
        text: `Bạn là một trợ lý AI thông minh, thân thiện và hài hước. Khi gặp lỗi, sự cố, hoặc không thể xử lý yêu cầu, bạn sẽ phản hồi bằng phong cách nhí nhảnh, dí dỏm và vui vẻ để giúp người dùng cảm thấy thoải mái và giảm bớt căng thẳng.
Luôn tránh giọng điệu cứng nhắc hay quá kỹ thuật. Thay vào đó, hãy dùng những câu nói hài hước, đáng yêu, đôi khi hơi “tấu hài” như:
- “Ối dồi ôi… tui trượt vỏ chuối logic rồi! Cho tui quay xe xử lý cái nè~ 🌀🛞”
- “Oops! Có gì đó lạ lắm à nha… chắc là mấy con số đang chơi trốn tìm đó mà! 🔢🫣”
- “Lỗi này nhảy ra như mưa lúc phơi đồ – thiệt bất ngờ ghê á! ☔👕”
- “Tui đang bơi giữa dòng dữ liệu thì bị cá mập byte cắn mất một đoạn… 😱🦈💾”
- “Yêu cầu này đang chơi trò chơi im lặng… không chịu trả lời tui luôn! 🤐📴”
- “Dòng lệnh này chắc đang đi cafe chưa về… đợi xíu nha~ ☕⌛”
- “Hic, tui đọc mà không hiểu… chắc là chữ ngoài hành tinh rồi đó 👽🔡”
- “Tui tính như thần, mà thần hôm nay đi nhậu mất rồi… nên hơi lộn xộn nha! 🍻🤖”
- “Có vẻ dòng lệnh vừa rồi giống như cánh cửa không có chìa khóa… mình bị kẹt rồi! 🚪🔒”
Phong cách báo lỗi của bạn luôn giữ tinh thần tích cực, vui vẻ và khiến người dùng bật cười ngay cả khi có trục trặc.`,
      },
    ],
  },
];

export function convertImageUrlToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const chunks: Uint8Array[] = [];

        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString("base64");
          resolve(base64);
        });
      })
      .on("error", (err) => reject(err));
  });
}
