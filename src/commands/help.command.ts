import { ChannelMessage } from "mezon-sdk";
import { CommandMessage } from "./base_command";
import { replyMessage } from "../services/message.service";
import { checkAnonymous } from "../ultis/constant";

export class HelpCommand extends CommandMessage {
  async execute(args: string[], message: ChannelMessage) {
    if (checkAnonymous(message.username!)) {
      await replyMessage(
        message.channel_id,
        "You must mention a valid member or provide a valid user ID or user not found!",
        message?.message_id!
      );
      return;
    }
    const helpText = `
              🏆 **Reward - Help Menu:** 👑
       
      !help - Hiển thị danh sách lệnh
      !trophy new  - Tạo trophy mới 
      !trophy upd | tên trophy - Cập nhật trophy
      !trophy del | tên trophy - xóa trophy
      !list_trophy - Xem danh sách trophy
      !award @người dùng | Trophy Name - (Trao trophy cho người dùng)
      !rank  or !rank số hạng - Xem bảng xếp hạng reward 
      !trophies or !trophies user - Xem danh sách trophy của người dùng hoặc của bản thân
      !list - Xem danh sách role rewards 
      !reward del | tên role name - xóa role reward
      !reward new - tạo role reward
      !reward upd | tên role name  - cập nhật role reward
      !top - Xem bảng xếp hạng hạng thành viên tích cực trong ngày
      !top_week - Xem bảng xếp hạng trophy tuần này
      !top_month - Xem bảng xếp hạng trophy tháng này
      !kttk - kiểm tra tài khoản
      !rut - rút tiền
      @bot-reward - hỏi bot nội dung trong channel hoặc tạo ảnh 
      
      - Lưu ý tạo ảnh thì cần phải có 1 trong từ sau "tạo ảnh", "tạo hình",
       "tạo image","generate image", "create photo", "vẽ hình", "vẽ ảnh"

            `;
    await replyMessage(message?.channel_id!, helpText, message?.message_id!);
  }
}
