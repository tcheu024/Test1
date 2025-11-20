const { REST, Routes, SlashCommandBuilder } = require("discord.js");

class CommandHandler {
  constructor(bingoManager) {
    this.bingoManager = bingoManager;
    this.commands = this.buildCommands();
  }

  buildCommands() {
    return [
      // Create new bingo card
      new SlashCommandBuilder()
        .setName("bingo-new")
        .setDescription("Create a new Valorant bingo card")
        .addStringOption((option) =>
          option
            .setName("difficulty")
            .setDescription("Choose difficulty level")
            .setRequired(false)
            .addChoices(
              { name: "Easy", value: "easy" },
              { name: "Medium", value: "medium" },
              { name: "Hard", value: "hard" },
              { name: "Mixed (Recommended)", value: "mixed" }
            )
        )
        .toJSON(),

      // View current bingo card
      new SlashCommandBuilder()
        .setName("bingo-card")
        .setDescription("View your current bingo card")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("View another user's card")
            .setRequired(false)
        )
        .toJSON(),

      // Mark challenge as complete
      new SlashCommandBuilder()
        .setName("bingo-mark")
        .setDescription("Mark a challenge as completed")
        .addStringOption((option) =>
          option
            .setName("position")
            .setDescription("Position on card (e.g., A1, B3, C2)")
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("completed")
            .setDescription("Mark as completed or uncompleted")
            .setRequired(false)
        )
        .toJSON(),

      // View challenges list
      new SlashCommandBuilder()
        .setName("bingo-challenges")
        .setDescription("View all challenges on your bingo card with positions")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("View challenges for another user")
            .setRequired(false)
        )
        .toJSON(),

      // View leaderboard
      new SlashCommandBuilder()
        .setName("bingo-leaderboard")
        .setDescription("View the server bingo leaderboard")
        .toJSON(),

      // Delete bingo card
      new SlashCommandBuilder()
        .setName("bingo-reset")
        .setDescription("Delete your current bingo card")
        .toJSON(),

      // Get random challenge
      new SlashCommandBuilder()
        .setName("bingo-random")
        .setDescription("Get a random Valorant challenge to attempt")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Type of challenge")
            .setRequired(false)
            .addChoices(
              { name: "Easy", value: "easy" },
              { name: "Medium", value: "medium" },
              { name: "Hard", value: "hard" },
              { name: "Agent Specific", value: "agent" },
              { name: "Weapon Challenge", value: "weapon" },
              { name: "Fun/Meme", value: "fun" }
            )
        )
        .toJSON(),

      // Help command
      new SlashCommandBuilder()
        .setName("bingo-help")
        .setDescription("Get help with Valorant bingo bot commands")
        .toJSON(),
    ];
  }

  async handleCommand(interaction) {
    const { commandName } = interaction;

    try {
      switch (commandName) {
        case "bingo-new":
          await this.handleNewCard(interaction);
          break;
        case "bingo-card":
          await this.handleViewCard(interaction);
          break;
        case "bingo-mark":
          await this.handleMarkChallenge(interaction);
          break;
        case "bingo-challenges":
          await this.handleViewChallenges(interaction);
          break;
        case "bingo-leaderboard":
          await this.handleLeaderboard(interaction);
          break;
        case "bingo-reset":
          await this.handleResetCard(interaction);
          break;
        case "bingo-random":
          await this.handleRandomChallenge(interaction);
          break;
        case "bingo-help":
          await this.handleHelp(interaction);
          break;
        default:
          await interaction.reply({
            content: "Unknown command!",
            ephemeral: true,
          });
      }
    } catch (error) {
      console.error("Error handling command:", error);
      const errorMsg =
        "An error occurred while processing your command. Please try again.";

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMsg, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMsg, ephemeral: true });
      }
    }
  }

  async handleNewCard(interaction) {
    const difficulty = interaction.options.getString("difficulty") || "mixed";
    const serverId = interaction.guild.id;
    const userId = interaction.user.id;
    const username = interaction.user.username;

    // Check if user already has a card
    const existingCard = this.bingoManager.getCard(serverId, userId);
    if (existingCard) {
      await interaction.reply({
        content:
          "⚠️ You already have an active bingo card! Use `/bingo-reset` to delete it first.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const card = await this.bingoManager.createCard(
      serverId,
      userId,
      username,
      difficulty
    );
    const embed = this.bingoManager.createCardEmbed(card);

    await interaction.editReply({
      content: "🎉 Your new Valorant bingo card has been created!",
      embeds: [embed],
    });
  }

  async handleViewCard(interaction) {
    const targetUser = interaction.options.getUser("user") || interaction.user;
    const serverId = interaction.guild.id;
    const userId = targetUser.id;

    const card = this.bingoManager.getCard(serverId, userId);
    if (!card) {
      const msg =
        targetUser.id === interaction.user.id
          ? "You don't have an active bingo card! Use `/bingo-new` to create one."
          : `${targetUser.username} doesn't have an active bingo card.`;

      await interaction.reply({ content: msg, ephemeral: true });
      return;
    }

    const embed = this.bingoManager.createCardEmbed(card);
    await interaction.reply({ embeds: [embed] });
  }

  async handleMarkChallenge(interaction) {
    const position = interaction.options.getString("position").toUpperCase();
    const completed = interaction.options.getBoolean("completed") ?? true;
    const serverId = interaction.guild.id;
    const userId = interaction.user.id;

    // Parse position (e.g., "A1" -> row 0, col 0)
    if (position.length !== 2) {
      await interaction.reply({
        content: "Invalid position format! Use format like A1, B3, C2, etc.",
        ephemeral: true,
      });
      return;
    }

    const col = position.charCodeAt(0) - 65; // A=0, B=1, etc.
    const row = parseInt(position.charAt(1)) - 1; // 1=0, 2=1, etc.

    if (col < 0 || col > 4 || row < 0 || row > 4) {
      await interaction.reply({
        content: "Invalid position! Use A1-E5 format.",
        ephemeral: true,
      });
      return;
    }

    const result = await this.bingoManager.markChallenge(
      serverId,
      userId,
      row,
      col,
      completed
    );

    if (!result.success) {
      await interaction.reply({ content: result.message, ephemeral: true });
      return;
    }

    let response = `${completed ? "✅" : "❌"} **${position}**: ${
      result.challenge
    }`;

    if (result.bingoResult.hasBingo && completed) {
      response += "\n\n🎉 **BINGO!** 🎉\nCongratulations! You got a bingo!";
    }

    await interaction.reply({ content: response });
  }

  async handleViewChallenges(interaction) {
    const targetUser = interaction.options.getUser("user") || interaction.user;
    const serverId = interaction.guild.id;
    const userId = targetUser.id;

    const card = this.bingoManager.getCard(serverId, userId);
    if (!card) {
      const msg =
        targetUser.id === interaction.user.id
          ? "You don't have an active bingo card! Use `/bingo-new` to create one."
          : `${targetUser.username} doesn't have an active bingo card.`;

      await interaction.reply({ content: msg, ephemeral: true });
      return;
    }

    let challengesList = `**🎯 ${targetUser.username}'s Bingo Challenges:**\n\n`;
    const letters = ["A", "B", "C", "D", "E"];

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const position = `${letters[col]}${row + 1}`;
        const challenge = card.challenges[row][col];
        const status = card.completed[row][col] ? "✅" : "⭕";
        challengesList += `${status} **${position}**: ${challenge}\n`;
      }
    }

    // Split into multiple messages if too long
    if (challengesList.length > 2000) {
      challengesList =
        challengesList.substring(0, 1900) +
        "...\n\n*Use `/bingo-card` for a compact view.*";
    }

    await interaction.reply({ content: challengesList, ephemeral: true });
  }

  async handleLeaderboard(interaction) {
    const serverId = interaction.guild.id;
    const leaderboard = this.bingoManager.getLeaderboard(serverId);

    if (leaderboard.length === 0) {
      await interaction.reply({
        content: "No active bingo cards in this server!",
        ephemeral: true,
      });
      return;
    }

    let leaderboardText = "🏆 **Valorant Bingo Leaderboard**\n\n";

    leaderboard.forEach((entry, index) => {
      const medal =
        index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🔸";
      const bingoText = entry.hasBingo
        ? ` (${entry.totalBingos} Bingo${entry.totalBingos > 1 ? "s" : ""})`
        : "";

      leaderboardText += `${medal} **${entry.username}**: ${entry.completedCells}/25${bingoText}\n`;
    });

    await interaction.reply({ content: leaderboardText });
  }

  async handleResetCard(interaction) {
    const serverId = interaction.guild.id;
    const userId = interaction.user.id;

    const success = await this.bingoManager.deleteCard(serverId, userId);

    if (success) {
      await interaction.reply({
        content: "🗑️ Your bingo card has been deleted!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "You don't have an active bingo card to delete.",
        ephemeral: true,
      });
    }
  }

  async handleRandomChallenge(interaction) {
    const type = interaction.options.getString("type") || "mixed";
    const BINGO_CHALLENGES = require("../data/challenges");

    let challenges = [];

    switch (type) {
      case "easy":
        challenges = BINGO_CHALLENGES.easy;
        break;
      case "medium":
        challenges = BINGO_CHALLENGES.medium;
        break;
      case "hard":
        challenges = BINGO_CHALLENGES.hard;
        break;
      case "agent":
        const agents = Object.keys(BINGO_CHALLENGES.agentSpecific);
        const randomAgent = agents[Math.floor(Math.random() * agents.length)];
        const agentChallenges = BINGO_CHALLENGES.agentSpecific[randomAgent];
        challenges = agentChallenges.map(
          (challenge) => `${randomAgent}: ${challenge}`
        );
        break;
      case "weapon":
        challenges = BINGO_CHALLENGES.weaponChallenges;
        break;
      case "fun":
        challenges = BINGO_CHALLENGES.funChallenges;
        break;
      default:
        challenges = [
          ...BINGO_CHALLENGES.easy,
          ...BINGO_CHALLENGES.medium,
          ...BINGO_CHALLENGES.hard,
        ];
    }

    if (challenges.length === 0) {
      await interaction.reply({
        content: "No challenges available for that type!",
        ephemeral: true,
      });
      return;
    }

    const randomChallenge =
      challenges[Math.floor(Math.random() * challenges.length)];
    await interaction.reply({
      content: `🎲 **Random Challenge (${type}):** ${randomChallenge}`,
    });
  }

  async handleHelp(interaction) {
    const helpEmbed = {
      title: "🎯 Valorant Bingo Bot Help",
      color: 0x0099ff,
      fields: [
        {
          name: "🎮 Getting Started",
          value:
            "`/bingo-new` - Create a new bingo card\n`/bingo-card` - View your card\n`/bingo-challenges` - List all challenges",
          inline: false,
        },
        {
          name: "✅ Marking Progress",
          value:
            "`/bingo-mark A1 true` - Mark challenge A1 as complete\n`/bingo-mark B3 false` - Mark B3 as incomplete",
          inline: false,
        },
        {
          name: "🏆 Competition",
          value:
            "`/bingo-leaderboard` - View server rankings\n`/bingo-random` - Get random challenges",
          inline: false,
        },
        {
          name: "🔄 Management",
          value: "`/bingo-reset` - Delete your current card",
          inline: false,
        },
        {
          name: "📍 Position Format",
          value:
            "Use A1-E5 format (A=leftmost column, 1=top row)\nExample: A1, B3, C2, D5, E4",
          inline: false,
        },
      ],
      footer: {
        text: "Have fun completing challenges with your friends!",
      },
    };

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  }

  async deployCommands() {
    if (!process.env.DISCORD_TOKEN) {
      console.error("❌ DISCORD_TOKEN not found in environment variables!");
      return;
    }

    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN
    );

    try {
      console.log("🔄 Started refreshing application (/) commands.");

      // For development, you might want to register commands to a specific guild
      // For production, register globally (remove guild_id)
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID || "YOUR_CLIENT_ID"),
        { body: this.commands }
      );

      console.log("✅ Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error("❌ Error deploying commands:", error);
    }
  }
}

module.exports = CommandHandler;
