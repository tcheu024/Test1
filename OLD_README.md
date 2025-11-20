# 🎯 Valorant Bingo Discord Bot

A Discord bot that creates interactive Valorant-themed bingo cards for you and your friends to complete challenges together!

## ✨ Features

- **🎮 Interactive Bingo Cards**: Generate 5x5 bingo cards with Valorant challenges
- **🎲 Multiple Difficulty Levels**: Easy, Medium, Hard, and Mixed difficulty options
- **🏆 Server Leaderboards**: Compete with friends and track progress
- **📊 Progress Tracking**: Mark challenges as complete and track your bingo progress
- **🎯 Challenge Variety**: 100+ unique challenges including:
  - Agent-specific challenges
  - Weapon-based challenges
  - Map-specific challenges
  - Fun/meme challenges
- **🔧 Optional Riot API Integration**: Automatically validate some achievements (requires API key)

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- A Discord Bot Token
- (Optional) Riot Games API Key for advanced features

### Installation

1. **Clone or download this project**

   ```bash
   git clone <repository-url>
   cd valorant-bingo-bot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your tokens:

   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_bot_client_id_here
   RIOT_API_KEY=your_riot_api_key_here
   ```

### Discord Bot Setup

1. **Create a Discord Application**

   - Go to https://discord.com/developers/applications
   - Click "New Application" and give it a name
   - Go to the "Bot" section and click "Create Bot"

2. **Get your Bot Token**

   - In the Bot section, click "Copy" under Token
   - Paste this into your `.env` file as `DISCORD_TOKEN`

3. **Get your Client ID**

   - Go to the "General Information" section
   - Copy the "Application ID"
   - Paste this into your `.env` file as `CLIENT_ID`

4. **Set Bot Permissions**

   - Go to the "Bot" section
   - Under "Privileged Gateway Intents", enable:
     - ✅ Message Content Intent (if you want message-based features)
   - Under "Bot Permissions", select:
     - ✅ Send Messages
     - ✅ Use Slash Commands
     - ✅ Add Reactions
     - ✅ Read Message History

5. **Invite Bot to Your Server**
   - Go to the "OAuth2" > "URL Generator" section
   - Select scopes: `bot` and `applications.commands`
   - Select permissions: `Send Messages`, `Use Slash Commands`, `Add Reactions`
   - Use the generated URL to invite your bot

### Running the Bot

1. **Start the bot**

   ```bash
   npm start
   ```

   For development with auto-restart:

   ```bash
   npm run dev
   ```

2. **The bot should now be online!** Look for the message:
   ```
   🎯 YourBotName#1234 is online and ready for Valorant Bingo!
   ```

## 🎮 How to Use

### Basic Commands

- `/bingo-new [difficulty]` - Create a new bingo card
- `/bingo-card [@user]` - View your or someone else's bingo card
- `/bingo-mark <position> [completed]` - Mark a challenge as complete/incomplete
- `/bingo-challenges [@user]` - View all challenges with their positions
- `/bingo-leaderboard` - See server rankings
- `/bingo-reset` - Delete your current card
- `/bingo-random [type]` - Get a random challenge
- `/bingo-help` - Show help information

### Challenge Positions

Bingo cards use a grid system:

```
   A   B   C   D   E
1  A1  B1  C1  D1  E1
2  A2  B2  C2  D2  E2
3  A3  B3  C3  D3  E3
4  A4  B4  C4  D4  E4
5  A5  B5  C5  D5  E5
```

Example: `/bingo-mark A1 true` marks the top-left challenge as complete.

### Difficulty Levels

- **Easy**: Basic gameplay challenges (5+ kills, win a match, etc.)
- **Medium**: Skill-based challenges (double kills, clutches, etc.)
- **Hard**: Expert challenges (aces, 20+ kills, etc.)
- **Mixed**: Balanced combination of all difficulties (recommended)

## 🔧 Optional: Riot API Integration

To enable automatic challenge validation:

1. **Get a Riot API Key**

   - Go to https://developer.riotgames.com/
   - Sign in with your Riot account
   - Create a personal API key
   - Add it to your `.env` file as `RIOT_API_KEY`

2. **Features with API Integration**
   - Automatic validation of some challenges
   - Player statistics lookup
   - Match history analysis

> **Note**: The Riot API has rate limits and personal API keys expire every 24 hours. For production use, you'll need to apply for a production API key.

## 🎯 Example Challenges

### Easy Challenges

- Get 5 kills in a single match
- Win a match
- Play as Sage/Jett
- Get a headshot kill

### Medium Challenges

- Get 10+ kills in a single match
- Get a double kill
- Clutch a 1v2 situation
- Top frag in your team

### Hard Challenges

- Get an Ace (5 kills in one round)
- Get 20+ kills in a single match
- Clutch a 1v4 situation
- Win a match without dying

### Agent-Specific Examples

- **Jett**: Get 3 kills after using Dash
- **Sage**: Revive 3 teammates in one match
- **Sova**: Get 10 recon assists in one match

## 🔧 Customization

### Adding New Challenges

Edit `src/data/challenges.js` to add your own challenges:

```javascript
easy: [
  "Your new easy challenge",
  // ... existing challenges
];
```

### Changing Card Size

Modify the `cardSize` property in `BingoCardGenerator.js` to create different sized cards (though Discord formatting works best with 5x5).

## 🚀 Deployment

### Option 1: Local Hosting

Keep the bot running on your computer:

```bash
npm start
```

### Option 2: Cloud Hosting (Heroku)

1. Create a Heroku account
2. Install Heroku CLI
3. Deploy:
   ```bash
   heroku create your-valorant-bingo-bot
   heroku config:set DISCORD_TOKEN=your_token_here
   heroku config:set CLIENT_ID=your_client_id_here
   git push heroku main
   ```

### Option 3: VPS/Server

1. Upload files to your server
2. Install Node.js and npm
3. Set up environment variables
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start index.js --name "valorant-bingo-bot"
   pm2 startup
   pm2 save
   ```

## 🛠️ Troubleshooting

### Common Issues

1. **Bot doesn't respond to commands**

   - Check that slash commands are registered (wait a few minutes after starting)
   - Ensure bot has proper permissions
   - Check console for error messages

2. **"Unknown command" error**

   - Make sure `CLIENT_ID` is set in your `.env` file
   - Commands may take time to register globally (up to 1 hour)

3. **Bot goes offline frequently**

   - Check your internet connection
   - Use a process manager like PM2 for automatic restarts

4. **Riot API errors**
   - Verify your API key is correct and hasn't expired
   - Check rate limits (personal keys have low limits)

### Debug Mode

Set `NODE_ENV=development` for more detailed logging.

## 🤝 Contributing

Feel free to submit issues and enhancement requests! Some ideas for contributions:

- New challenge categories
- Better Discord embed formatting
- Additional API integrations
- Web dashboard
- Mobile app companion

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This project is not affiliated with Riot Games. Valorant is a trademark of Riot Games, Inc.

---

**Have fun fragging and completing challenges with your friends! 🎮**
