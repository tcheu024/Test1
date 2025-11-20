const { Client, GatewayIntentBits, Collection } = require("discord.js");
const express = require("express");
require("dotenv").config();

const ValorantTracker = require("./src/tracker/HenrikTracker");
const CommandHandler = require("./src/commands/CommandHandler");

class ValorantMatchBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });

    this.valorantTracker = new ValorantTracker();
    this.commandHandler = new CommandHandler(this.valorantTracker);

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.client.once("ready", () => {
      console.log(
        `🎯 ${this.client.user.tag} is online and tracking Valorant matches!`
      );
      this.client.user.setActivity("Valorant Match Data", { type: "WATCHING" });
    });

    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.commandHandler.handleCommand(interaction);
    });
  }

  async start() {
    try {
      // Start Express server for Railway
      const app = express();
      const PORT = process.env.PORT || 3000;
      
      app.get("/", (req, res) => {
        res.json({ 
          status: "Bot is running!", 
          bot: this.client.user?.tag || "Starting...",
          uptime: process.uptime()
        });
      });
      
      app.listen(PORT, () => {
        console.log(`🌐 Health check server running on port ${PORT}`);
      });

      await this.commandHandler.deployCommands(
        process.env.CLIENT_ID,
        process.env.DISCORD_TOKEN
      );
      await this.client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
      console.error("❌ Error starting bot:", error);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("🔄 Bot shutting down gracefully...");
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

// Start the bot
const bot = new ValorantMatchBot();
bot.start();
