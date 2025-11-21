const { Client, GatewayIntentBits, Collection } = require("discord.js");
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
      try {
        await this.commandHandler.handleCommand(interaction);
      } catch (error) {
        console.error("Error handling interaction:", error);

        // Try to respond to the interaction if possible
        try {
          const errorMsg =
            "❌ An error occurred while processing your command.";
          if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: errorMsg, ephemeral: true });
          } else {
            await interaction.reply({ content: errorMsg, ephemeral: true });
          }
        } catch (responseError) {
          console.error("Failed to send error response:", responseError);
        }
      }
    });
  }

  async start() {
    try {
      console.log("🚀 Starting Valorant Discord Bot...");

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
const gracefulShutdown = () => {
  console.log("🔄 Bot shutting down gracefully...");

  // Close Discord client
  if (bot && bot.client) {
    bot.client.destroy();
  }

  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit process, just log the error
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // For critical errors, shutdown gracefully
  gracefulShutdown();
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

// Start the bot
let bot = new ValorantMatchBot();
bot.start();
