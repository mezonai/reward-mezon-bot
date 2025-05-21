# Reward Mezon Bot

Hệ thống quản lý phần thưởng (reward) và danh hiệu (trophy) cho người dùng Mezon, sử dụng Mezon SDK và Model Context Protocol.

## 🌟 Tính năng

### Quản lý Danh hiệu (Trophy)

- Tạo và tùy chỉnh danh hiệu cho người dùng trong server
- Trao danh hiệu với các giá trị điểm khác nhau cho người dùng
- Tùy chỉnh tên, mô tả, điểm cho danh hiệu
- Xem bảng xếp hạng người dùng đạt được danh hiệu

### Quản lý Role Reward

- Tùy chỉnh phần thưởng role reward cho người dùng khi đạt đến điểm số nhất định
- Tự động gán role reward dựa trên thành tích đạt được

### Bảng xếp hạng

- Hiển thị bảng xếp hạng theo ngày, tuần, tháng
- Theo dõi và hiển thị người dùng tích cực

### Tích hợp tài khoản

- Kiểm tra tài khoản
- Rút token

## 🚀 Bắt đầu

### Yêu cầu

- Node.js (v16 trở lên)
- PostgreSQL database
- Mezon Bot Token

### Cài đặt

1. Clone repository:

```bash
git clone https://github.com/yourusername/reward-mezon-bot.git
cd reward-mezon-bot
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Tạo file `.env` ở thư mục gốc với các biến sau:

```env
# Mezon Bot Configuration
MEZON_TOKEN=your_mezon_bot_token
BOT=your_bot_user_id
BOT_NAME=your_bot_display_name

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_NAME=your_database_name

# API Keys
GEMINI_API_KEY=your_gemini_api_key
```

4. Build project:

```bash
npm run build
```

5. Khởi động bot:

```bash
npm start
```

Cho môi trường phát triển:

```bash
npm run dev
```

## 📝 Lệnh Bot

### Lệnh Danh hiệu (Trophy)

- `!trophy new` - Tạo danh hiệu mới
- `!trophy upd | tên trophy` - Cập nhật danh hiệu
- `!trophy del | tên trophy` - Xóa danh hiệu
- `!list_trophy` - Xem danh sách danh hiệu
- `!award @người dùng | Trophy Name` - Trao danh hiệu cho người dùng
- `!trophies` hoặc `!trophies user` - Xem danh sách danh hiệu của người dùng

### Lệnh Role

- `!list` - Xem danh sách role reward
- `!reward new` - Tạo role reward mới
- `!reward upd | tên role name` - Cập nhật role reward
- `!reward del | tên role name` - Xóa phần role reward

### Lệnh Bảng xếp hạng

- `!rank` hoặc `!rank số hạng` - Xem bảng xếp hạng reward
- `!top` - Xem bảng xếp hạng thành viên tích cực trong ngày
- `!top_week` - Xem bảng xếp hạng trophy tuần này
- `!top_month` - Xem bảng xếp hạng trophy tháng này

### Lệnh Khác

- `!help` - Hiển thị danh sách các lệnh có sẵn
- `!kttk` - Kiểm tra tài khoản
- `!rut` - Rút tiền
- `@bot-reward` - Hỏi bot trong channel

## 🛠️ Công nghệ sử dụng

- TypeScript
- PostgreSQL
- Sequelize ORM
- Model Context Protocol (MCP)
- Mezon SDK
- Redis
- Cron (lịch trình tự động)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
