# 🎯 Valorant Match Tracker Discord Bot

A comprehensive Discord bot that tracks and analyzes **EVERY** piece of data from your latest Valorant matches using the official Riot Games API!

## ✨ Features

### 📊 **Complete Match Analytics**

- **Player Statistics**: Kills, deaths, assists, score, playtime
- **Agent Performance**: Track performance with each Valorant agent
- **Match Details**: Map, duration, game mode, competitive tier
- **Advanced Metrics**: K/D ratio, KDA, kills per round, team ranking
- **Round-by-Round Data**: Detailed breakdown of each round (when available)
- **Team Comparisons**: Compare your performance with teammates and enemies

### 🔗 **Account Management**

- **Link Riot Accounts**: Connect Discord users to their Valorant accounts
- **Multi-User Support**: Track multiple players in your server
- **Persistent Storage**: Account links are saved across bot restarts

### 🎮 **Rich Discord Integration**

- **Slash Commands**: Modern Discord slash command interface
- **Rich Embeds**: Beautiful, color-coded match displays
- **Real-time Data**: Always shows your most recent match
- **Error Handling**: Comprehensive error messages and help

## 🚀 Commands Overview

| Command               | Description                              | Usage                        |
| --------------------- | ---------------------------------------- | ---------------------------- |
| `/link username tag`  | Link your Riot account                   | `/link PlayerName 1234`      |
| `/match [@player]`    | Get latest match stats                   | `/match` or `/match @friend` |
| `/overview [@player]` | Detailed match overview with all players | `/overview`                  |
| `/rounds [@player]`   | Round-by-round breakdown                 | `/rounds`                    |
| `/account [@user]`    | View linked account info                 | `/account`                   |
| `/unlink`             | Remove linked account                    | `/unlink`                    |
| `/raw [full]`         | Raw API data (for developers)            | `/raw full:true`             |
| `/help`               | Show all commands                        | `/help`                      |

## 📋 What Data Gets Tracked

### **Player Performance**

- ✅ Kills, Deaths, Assists
- ✅ Score and Combat Rating
- ✅ Playtime and Rounds Played
- ✅ Agent Used
- ✅ Competitive Tier/Rank
- ✅ Ability Casts (Ultimate, Ability 1, 2, 3, Grenade)

### **Match Information**

- ✅ Map Name and Game Mode
- ✅ Match Duration
- ✅ Game Start Time
- ✅ Match Result (Win/Loss)
- ✅ Team Compositions
- ✅ Queue Type (Ranked/Unranked/etc.)

### **Advanced Analytics**

- ✅ K/D and KDA Ratios
- ✅ Average Damage Per Round
- ✅ Kills Per Round
- ✅ Team Performance Ranking
- ✅ Round Win/Loss Results
- ✅ Bomb Plant/Defuse Data (when available)

### **Team Data**

- ✅ All 10 Players' Statistics
- ✅ Team Round Scores
- ✅ Agent Compositions
- ✅ Performance Rankings

## 🛠️ Setup Guide

### **Prerequisites**

- Node.js 16.0.0 or higher
- Discord Bot Token
- **Riot Games API Key** (Required!)

### **1. Get Your Riot API Key**

1. Go to https://developer.riotgames.com/
2. Sign in with your Riot account
3. Create a **Personal API Key**
4. Copy the key (starts with `RGAPI-`)

> ⚠️ **Important**: Personal API keys expire every 24 hours. For production use, apply for a production key.

### **2. Discord Bot Setup**

1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to **Bot** section → **Add Bot**
4. Copy the **Bot Token**
5. Get your **Application ID** from **General Information**

### **3. Installation**

```bash
# Clone/download the project
cd valorant-match-tracker-bot

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### **4. Configure Environment**

Edit your `.env` file:

```env
# Discord Bot Token (from Bot section)
DISCORD_TOKEN=your_bot_token_here

# Discord Client ID (from General Information)
CLIENT_ID=your_application_id_here

# Riot API Key (from developer.riotgames.com)
RIOT_API_KEY=RGAPI-your-api-key-here
```

### **5. Bot Permissions**

When inviting your bot, ensure these permissions:

- ✅ Send Messages
- ✅ Use Slash Commands
- ✅ Embed Links
- ✅ Read Message History

**Invite URL Template:**

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147534848&scope=bot%20applications.commands
```

### **6. Start the Bot**

```bash
npm start
```

You should see: `🎯 BotName is online and tracking Valorant matches!`

## 🎮 How to Use

### **Step 1: Link Your Account**

```
/link YourValorantName 1234
```

Replace with your actual Riot ID (the name and numbers after #)

### **Step 2: Play Valorant**

Play any Valorant match (Competitive, Unrated, etc.)

### **Step 3: Check Your Stats**

```
/match
```

Get comprehensive stats from your latest match!

### **Example Output**

The bot will show:

- 🏆 **Match Result** (Victory/Defeat)
- 📊 **Your K/D/A** (15/8/4)
- 🎯 **Performance Stats** (Score, KD Ratio, Team Rank)
- 👥 **All 10 Players** with their stats
- 🗺️ **Map, Agent, Duration** and more!

## 📊 Sample Commands

```bash
# Link your account
/link PlayerName 1234

# View your latest match
/match

# Check a friend's stats
/match player:@friend

# Get detailed overview with all players
/overview

# See round-by-round breakdown
/rounds

# Check your linked account
/account

# View raw API data (for developers)
/raw full:true
```

## 🔧 Advanced Features

### **For Developers**

- **Raw Data Access**: Use `/raw` to see complete API responses
- **Full Match Data**: Every field from Riot's match API
- **Extensible Design**: Easy to add new statistics and features

### **API Rate Limits**

- Personal API keys: 100 requests every 2 minutes
- Monitor your usage to avoid rate limiting
- Consider getting a production key for heavy usage

### **Supported Regions**

Currently configured for **North America (NA)**. You can modify the API endpoints in `ValorantTracker.js` for other regions:

- `eu.api.riotgames.com` (Europe)
- `ap.api.riotgames.com` (Asia Pacific)
- `kr.api.riotgames.com` (Korea)

## 🚀 Deployment Options

### **Option 1: Local (Development)**

```bash
npm start
```

### **Option 2: VPS/Server**

```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start index.js --name "valorant-tracker"

# Enable startup script
pm2 startup
pm2 save
```

### **Option 3: Heroku**

```bash
# Install Heroku CLI, then:
heroku create your-valorant-bot
heroku config:set DISCORD_TOKEN=your_token
heroku config:set CLIENT_ID=your_client_id
heroku config:set RIOT_API_KEY=your_riot_key
git push heroku main
```

## ❓ Troubleshooting

### **Common Issues**

**🔴 "No linked account found"**

- Solution: Use `/link YourName Tag` first

**🔴 "API key is invalid or expired"**

- Solution: Generate a new API key at developer.riotgames.com
- Personal keys expire every 24 hours

**🔴 "Rate limit exceeded"**

- Solution: Wait a few minutes before trying again
- Personal keys have low rate limits

**🔴 "Player not found"**

- Solution: Check spelling of your Riot ID
- Ensure you're using the correct region

**🔴 "No matches found"**

- Solution: Play a Valorant match first
- Some match types might not be tracked

### **Debug Mode**

Use `/raw` command to see what data is being returned from the API.

## 🔒 Privacy & Security

- **API Keys**: Never share your Riot API key
- **Data Storage**: Only Discord IDs and Riot PUUIDs are stored
- **Match Data**: Fetched in real-time, not permanently stored
- **Privacy**: All data comes from public Riot APIs

## 🤝 Contributing

Want to add features? Here are some ideas:

- **Historical match tracking**
- **Server leaderboards**
- **Performance trends over time**
- **Agent-specific analytics**
- **Custom match comparisons**
- **Rank tracking**

## 📝 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This project is not affiliated with Riot Games. Valorant is a trademark of Riot Games, Inc.

---

**🎮 Ready to track every detail of your Valorant matches? Get started with `/link` and see your complete match analytics!**
