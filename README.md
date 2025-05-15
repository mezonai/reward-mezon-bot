# Reward Mezon Bot

A powerful bot for managing server rewards and trophies using Model Context Protocol with TypeScript.

## 🌟 Features

### Trophy Management

- Create and customize trophies for your server users
- Award different value trophies for your servers
- Set custom name, description, points, etc. to your trophies
- View a leaderboard of the trophies you have earned

### Role Management

- Customize role rewards for users when they reach certain scores
- Automatically assign roles based on trophy achievements

### Server Customization

- Change special settings for your server on how the bot works
- Simple to use and easy to understand interface

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Bot Token
- Google AI API Key (for MCP integration)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/reward-mezon-bot.git
cd reward-mezon-bot
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
BOT_TOKEN=your_bot_token
DATABASE_URL=your_postgresql_connection_string
GOOGLE_API_KEY=your_google_ai_api_key
```

4. Build the project:

```bash
npm run build
```

5. Start the bot:

```bash
npm start
```

For development:

```bash
npm run dev
```

## 📝 Bot Commands

### Trophy Commands

- `/trophy create` - Create a new trophy
- `/trophy award` - Award a trophy to a user
- `/trophy list` - List all available trophies
- `/trophy leaderboard` - View trophy leaderboard

### Role Commands

- `/role set` - Set up role rewards
- `/role list` - List all role rewards

### Settings Commands

- `/settings view` - View current server settings
- `/settings update` - Update server settings

## 🛠️ Technologies Used

- TypeScript
- PostgreSQL
- Sequelize ORM
- Model Context Protocol (MCP)
- Google AI

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
