const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

class CommandHandler {
  constructor(valorantTracker) {
    this.valorantTracker = valorantTracker;
    this.commands = this.buildCommands();
  }

  buildCommands() {
    return [
      // Link Riot account
      new SlashCommandBuilder()
        .setName("link")
        .setDescription("Link your Riot account to track Valorant matches")
        .addStringOption((option) =>
          option
            .setName("username")
            .setDescription("Your Valorant username (without #)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("tag")
            .setDescription("Your Valorant tag (numbers after #)")
            .setRequired(true)
        )
        .toJSON(),

      // Get latest match with ALL data
      new SlashCommandBuilder()
        .setName("match")
        .setDescription("Get detailed stats from your latest Valorant match")
        .addUserOption((option) =>
          option
            .setName("player")
            .setDescription("Check another player's latest match")
            .setRequired(false)
        )
        .toJSON(),

      // Get comprehensive match overview
      new SlashCommandBuilder()
        .setName("overview")
        .setDescription(
          "Get a detailed overview of your latest match with all players"
        )
        .addUserOption((option) =>
          option
            .setName("player")
            .setDescription("View another player's match overview")
            .setRequired(false)
        )
        .toJSON(),

      // Get round-by-round breakdown
      new SlashCommandBuilder()
        .setName("rounds")
        .setDescription("Get detailed round-by-round breakdown of latest match")
        .addUserOption((option) =>
          option
            .setName("player")
            .setDescription("View another player's round breakdown")
            .setRequired(false)
        )
        .toJSON(),

      // Check linked account
      new SlashCommandBuilder()
        .setName("account")
        .setDescription("View linked Valorant account information")
        .addUserOption((option) =>
          option
            .setName("player")
            .setDescription("Check another player's linked account")
            .setRequired(false)
        )
        .toJSON(),

      // Unlink account
      new SlashCommandBuilder()
        .setName("unlink")
        .setDescription("Unlink your Valorant account")
        .toJSON(),

      // Raw match data for debugging
      new SlashCommandBuilder()
        .setName("raw")
        .setDescription("Get raw match data (debug)")
        .addUserOption((option) =>
          option
            .setName("player")
            .setDescription("Get raw data for another player")
            .setRequired(false)
        )
        .toJSON(),

      // Help command
      new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show all available commands and their usage")
        .toJSON(),

      // Feet command - tracks leg shots
      new SlashCommandBuilder()
        .setName("feet")
        .setDescription(
          "See how many leg shots you landed in your latest match"
        )
        .addUserOption((option) =>
          option
            .setName("player")
            .setDescription("Check another player's leg shots")
            .setRequired(false)
        )
        .toJSON(),

      // Minseo troll command - shows TenZ stats as minseo
      new SlashCommandBuilder()
        .setName("minseo")
        .setDescription(
          "Check minseo's latest match (totally real and not fake)"
        )
        .toJSON(),

      // Rank tracker command
      new SlashCommandBuilder()
        .setName("rank")
        .setDescription("Check current rank, RR, and recent changes")
        .addUserOption((option) =>
          option
            .setName("player")
            .setDescription("Check a linked Discord user's rank")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("username")
            .setDescription("Valorant username (without #)")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("tag")
            .setDescription("Valorant tag (numbers after #)")
            .setRequired(false)
        )
        .toJSON(),

      // Streak tracker command
      new SlashCommandBuilder()
        .setName("streak")
        .setDescription("Check win/loss streak from recent matches")
        .addUserOption((option) =>
          option
            .setName("player")
            .setDescription("Check a linked Discord user's streak")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("username")
            .setDescription("Valorant username (without #)")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("tag")
            .setDescription("Valorant tag (numbers after #)")
            .setRequired(false)
        )
        .toJSON(),
    ];
  }

  async handleCommand(interaction) {
    const { commandName } = interaction;

    try {
      switch (commandName) {
        case "link":
          await this.handleLink(interaction);
          break;
        case "match":
          await this.handleMatch(interaction);
          break;
        case "overview":
          await this.handleOverview(interaction);
          break;
        case "rounds":
          await this.handleRounds(interaction);
          break;
        case "account":
          await this.handleAccount(interaction);
          break;
        case "unlink":
          await this.handleUnlink(interaction);
          break;
        case "raw":
          await this.handleRaw(interaction);
          break;
        case "help":
          await this.handleHelp(interaction);
          break;
        case "feet":
          await this.handleFeet(interaction);
          break;
        case "minseo":
          await this.handleMinseo(interaction);
          break;
        case "rank":
          await this.handleRank(interaction);
          break;
        case "streak":
          await this.handleStreak(interaction);
          break;
        default:
          await interaction.reply({
            content: "Unknown command!",
            ephemeral: true,
          });
      }
    } catch (error) {
      console.error(`Error handling command ${commandName}:`, error);
      const errorMsg = "An error occurred while processing your command.";
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMsg, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMsg, ephemeral: true });
      }
    }
  }

  async handleLink(interaction) {
    const username = interaction.options.getString("username");
    const tag = interaction.options.getString("tag");
    const userId = interaction.user.id;

    await interaction.deferReply();

    try {
      const result = await this.valorantTracker.linkAccount(
        userId,
        username,
        tag
      );

      if (result.success) {
        const embed = {
          title: "✅ Account Linked Successfully!",
          description: `Your account **${username}#${tag}** has been linked!`,
          color: 0x00ff00,
          fields: [
            {
              name: "Valorant Account",
              value: `${username}#${tag}`,
              inline: true,
            },
            {
              name: "Discord User",
              value: interaction.user.username,
              inline: true,
            },
            {
              name: "Region",
              value: result.data.region || "Unknown",
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
        };

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: `❌ Failed to link account: ${result.error}`,
        });
      }
    } catch (error) {
      console.error("Link error:", error);
      await interaction.editReply({
        content: "❌ An error occurred while linking your account.",
      });
    }
  }

  async handleMatch(interaction) {
    const targetUser = interaction.options.getUser("player");
    const userId = targetUser ? targetUser.id : interaction.user.id;

    await interaction.deferReply();

    try {
      const matchData = await this.valorantTracker.getLatestMatchData(userId);

      if (!matchData.success) {
        await interaction.editReply({
          content: `❌ ${matchData.error}`,
        });
        return;
      }

      const data = matchData.data;
      const playerStats = data.playerStats;

      if (!playerStats) {
        await interaction.editReply({
          content: "❌ Could not find your stats in the match data.",
        });
        return;
      }

      // Create comprehensive match embed
      const embed = {
        title: `🎯 Latest Match Stats - ${playerStats.name}#${playerStats.tag}`,
        description: `**${data.matchInfo.map}** | ${
          data.matchInfo.gameMode
        } | ${data.matchInfo.gameStartPatched || "Unknown time"}`,
        color:
          playerStats.team === "Red" && data.teams.red.won
            ? 0xff6b6b
            : playerStats.team === "Blue" && data.teams.blue.won
            ? 0x4dabf7
            : 0x95a5a6,
        fields: [
          {
            name: "🏆 Match Result",
            value: `${
              (playerStats.team === "Red" && data.teams.red.won) ||
              (playerStats.team === "Blue" && data.teams.blue.won)
                ? "Victory"
                : "Defeat"
            } (${data.teams.red.rounds_won || 0}-${
              data.teams.blue.rounds_won || 0
            })`,
            inline: true,
          },
          {
            name: "🎭 Agent",
            value: playerStats.character || "Unknown",
            inline: true,
          },
          {
            name: "💀 K/D/A",
            value: `${playerStats.stats.kills}/${playerStats.stats.deaths}/${playerStats.stats.assists}`,
            inline: true,
          },
          {
            name: "📊 Combat Score",
            value: playerStats.stats.score.toString(),
            inline: false,
          },
          {
            name: "🎯 Accuracy Stats",
            value: `**Headshots:** ${playerStats.stats.headshots} | **Bodyshots:** ${playerStats.stats.bodyshots} | **Legshots:** ${playerStats.stats.legshots}`,
            inline: false,
          },
          {
            name: "🎪 Economy",
            value: `**Money Spent:** ${
              playerStats.economy?.spent_overall || 0
            } | **Loadout Value:** ${
              playerStats.economy?.loadout_value?.overall || 0
            }`,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Match error:", error);
      await interaction.editReply({
        content: "❌ An error occurred while fetching match data.",
      });
    }
  }

  async handleOverview(interaction) {
    const targetUser = interaction.options.getUser("player");
    const userId = targetUser ? targetUser.id : interaction.user.id;

    await interaction.deferReply();

    try {
      const matchData = await this.valorantTracker.getLatestMatchData(userId);

      if (!matchData.success) {
        await interaction.editReply({
          content: `❌ ${matchData.error}`,
        });
        return;
      }

      const data = matchData.data;

      // Create overview embed with all players
      const redTeam = data.stats
        .filter((p) => p.team === "Red")
        .map(
          (p) =>
            `${p.name}#${p.tag} (${p.character}) - ${p.stats.kills}/${p.stats.deaths}/${p.stats.assists}`
        )
        .join("\n");

      const blueTeam = data.stats
        .filter((p) => p.team === "Blue")
        .map(
          (p) =>
            `${p.name}#${p.tag} (${p.character}) - ${p.stats.kills}/${p.stats.deaths}/${p.stats.assists}`
        )
        .join("\n");

      const embed = {
        title: `📋 Match Overview - ${data.metadata.map}`,
        description: `${data.metadata.mode} | ${
          data.metadata.started_at
            ? new Date(data.metadata.started_at * 1000).toLocaleString()
            : "Unknown time"
        }`,
        color: 0x7289da,
        fields: [
          {
            name: `🔴 Red Team (${data.teams.red.rounds_won} rounds)`,
            value: redTeam || "No players found",
            inline: false,
          },
          {
            name: `🔵 Blue Team (${data.teams.blue.rounds_won} rounds)`,
            value: blueTeam || "No players found",
            inline: false,
          },
          {
            name: "🏆 Match Result",
            value: `${
              data.teams.red.won ? "Red Team Victory" : "Blue Team Victory"
            }`,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Overview error:", error);
      await interaction.editReply({
        content: "❌ An error occurred while fetching overview data.",
      });
    }
  }

  async handleRounds(interaction) {
    const targetUser = interaction.options.getUser("player");
    const userId = targetUser ? targetUser.id : interaction.user.id;

    await interaction.deferReply();

    try {
      const matchData = await this.valorantTracker.getLatestMatchData(userId);

      if (!matchData.success) {
        await interaction.editReply({
          content: `❌ ${matchData.error}`,
        });
        return;
      }

      const data = matchData.data;
      const playerStats = data.stats.find((p) => p.puuid === data.playerPuuid);

      if (!playerStats || !data.rounds) {
        await interaction.editReply({
          content: "❌ Round data not available for this match.",
        });
        return;
      }

      // Create rounds breakdown
      const roundsData = data.rounds
        .slice(0, 10) // Limit to first 10 rounds to avoid message limits
        .map((round, index) => {
          const playerRound = round.player_stats?.find(
            (p) => p.puuid === data.playerPuuid
          );
          if (!playerRound) return `**Round ${index + 1}:** No data`;

          return `**Round ${index + 1}:** ${playerRound.kills}K ${
            playerRound.deaths
          }D ${playerRound.assists}A | ${playerRound.score} ACS`;
        })
        .join("\n");

      const embed = {
        title: `🔄 Round Breakdown - ${playerStats.name}#${playerStats.tag}`,
        description: `**${data.metadata.map}** | ${data.metadata.mode}`,
        color: 0xffa500,
        fields: [
          {
            name: "📊 Round Stats",
            value: roundsData || "No round data available",
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Rounds error:", error);
      await interaction.editReply({
        content: "❌ An error occurred while fetching round data.",
      });
    }
  }

  async handleAccount(interaction) {
    const targetUser =
      interaction.options.getUser("player") || interaction.user;

    await interaction.deferReply();

    try {
      const accountData = this.valorantTracker.getLinkedAccount(targetUser.id);

      if (!accountData) {
        await interaction.editReply({
          content:
            targetUser.id === interaction.user.id
              ? "❌ You don't have a linked account. Use `/link` to connect your Valorant account."
              : `❌ ${targetUser.username} doesn't have a linked account.`,
        });
        return;
      }

      const embed = {
        title: "🔗 Linked Account Information",
        color: 0x7289da,
        fields: [
          {
            name: "Valorant Account",
            value: `${accountData.username}#${accountData.tag}`,
            inline: true,
          },
          {
            name: "Discord User",
            value: targetUser.username,
            inline: true,
          },
          {
            name: "Region",
            value: accountData.region || "Unknown",
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Account error:", error);
      await interaction.editReply({
        content: "❌ An error occurred while fetching account data.",
      });
    }
  }

  async handleUnlink(interaction) {
    const userId = interaction.user.id;

    await interaction.deferReply();

    try {
      const result = this.valorantTracker.unlinkAccount(userId);

      if (result) {
        await interaction.editReply({
          content: "✅ Your account has been unlinked successfully!",
        });
      } else {
        await interaction.editReply({
          content: "❌ You don't have a linked account to unlink.",
        });
      }
    } catch (error) {
      console.error("Unlink error:", error);
      await interaction.editReply({
        content: "❌ An error occurred while unlinking your account.",
      });
    }
  }

  async handleRaw(interaction) {
    const targetUser = interaction.options.getUser("player");
    const userId = targetUser ? targetUser.id : interaction.user.id;

    await interaction.deferReply();

    try {
      const matchData = await this.valorantTracker.getLatestMatchData(userId);

      if (!matchData.success) {
        await interaction.editReply({
          content: `❌ ${matchData.error}`,
        });
        return;
      }

      // Convert to JSON and truncate if too long
      const jsonData = JSON.stringify(matchData.data, null, 2);
      const truncated =
        jsonData.length > 1900 ? jsonData.substring(0, 1900) + "..." : jsonData;

      await interaction.editReply({
        content: `\`\`\`json\n${truncated}\n\`\`\``,
      });
    } catch (error) {
      console.error("Raw error:", error);
      await interaction.editReply({
        content: "❌ An error occurred while fetching raw data.",
      });
    }
  }

  async handleHelp(interaction) {
    const embed = {
      title: "🤖 Valorant Match Tracker Commands",
      description: "Track every detail of your Valorant matches!",
      color: 0x7289da,
      fields: [
        {
          name: "🔗 Account Management",
          value:
            "`/link` - Link your Riot account\n`/account` - View linked account\n`/unlink` - Unlink your account",
          inline: false,
        },
        {
          name: "📊 Match Stats",
          value:
            "`/match` - Detailed personal match stats\n`/overview` - Full match overview with all players\n`/rounds` - Round-by-round breakdown",
          inline: false,
        },
        {
          name: "🦶 Fun Commands",
          value:
            "`/feet` - See how many leg shots you landed\n`/minseo` - Check minseo's totally real stats",
          inline: false,
        },
        {
          name: "🛠️ Debug",
          value:
            "`/raw` - Raw match data (for debugging)\n`/help` - Show this help message",
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await interaction.reply({ embeds: [embed] });
  }

  async handleFeet(interaction) {
    const targetUser = interaction.options.getUser("player");
    const userId = targetUser ? targetUser.id : interaction.user.id;

    await interaction.deferReply();

    try {
      const matchData = await this.valorantTracker.getLatestMatchData(userId);

      if (!matchData.success) {
        await interaction.editReply({
          content: `❌ ${matchData.error}`,
        });
        return;
      }

      const data = matchData.data;
      const playerStats = data.stats.find((p) => p.puuid === data.playerPuuid);

      if (!playerStats) {
        await interaction.editReply({
          content: "❌ Could not find your stats in the match data.",
        });
        return;
      }

      // Extract leg shot data
      const legShots = playerStats.stats?.bodyshots?.leg || 0;
      const totalShots = playerStats.stats?.shots || 0;

      const embed = {
        title: "🦶 Feet Lover Stats",
        description: `${
          targetUser ? targetUser.username : interaction.user.username
        }'s leg shot performance`,
        color: 0xff69b4,
        fields: [
          {
            name: "🎯 Leg Shots",
            value: legShots.toString(),
            inline: true,
          },
          {
            name: "📊 Total Shots",
            value: totalShots.toString(),
            inline: true,
          },
          {
            name: "📈 Leg Shot %",
            value:
              totalShots > 0
                ? `${((legShots / totalShots) * 100).toFixed(1)}%`
                : "0%",
            inline: true,
          },
          {
            name: "🏆 Agent",
            value: playerStats.character || "Unknown",
            inline: false,
          },
          {
            name: "�� Match",
            value: `${data.metadata.map} | ${data.metadata.mode}`,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Feet error:", error);
      await interaction.editReply({
        content: "❌ An error occurred while fetching feet data.",
      });
    }
  }

  async handleMinseo(interaction) {
    await interaction.deferReply();

    try {
      // Get TenZ's latest match data
      const response = await axios.get(
        "https://api.henrikdev.xyz/valorant/v3/matches/na/TenZ/00005?size=1",
        {
          headers: {
            Authorization: "HDEV-3a357ccd-9c01-4732-a21f-42446da417ad",
          },
        }
      );

      if (
        response.data.status !== 200 ||
        !response.data.data ||
        response.data.data.length === 0
      ) {
        await interaction.editReply({
          content: "❌ Could not fetch minseo's latest match data.",
        });
        return;
      }

      const matchData = response.data.data[0];
      const playerStats = matchData.players.all_players.find(
        (p) => p.name.toLowerCase() === "tenz" && p.tag === "00005"
      );

      if (!playerStats) {
        await interaction.editReply({
          content: "❌ Could not find minseo in the match data.",
        });
        return;
      }

      // Create minseo embed with TenZ's data but displayed as minseo
      const embed = {
        title: "🎯 minseo#0913's Latest Match Stats",
        description: `**${matchData.metadata.map}** | ${
          matchData.metadata.mode
        } | ${new Date(matchData.metadata.game_start * 1000).toLocaleString()}`,
        color:
          playerStats.team === "Red"
            ? matchData.teams.red.has_won
              ? 0x00ff00
              : 0xff0000
            : matchData.teams.blue.has_won
            ? 0x00ff00
            : 0xff0000,
        fields: [
          {
            name: "🏆 Match Result",
            value: `${
              (playerStats.team === "Red" && matchData.teams.red.has_won) ||
              (playerStats.team === "Blue" && matchData.teams.blue.has_won)
                ? "Victory"
                : "Defeat"
            } (${matchData.teams.red.rounds_won}-${
              matchData.teams.blue.rounds_won
            })`,
            inline: true,
          },
          {
            name: "🎭 Agent",
            value: playerStats.character,
            inline: true,
          },
          {
            name: "💀 K/D/A",
            value: `${playerStats.stats.kills}/${playerStats.stats.deaths}/${playerStats.stats.assists}`,
            inline: true,
          },
          {
            name: "📊 ACS",
            value: playerStats.stats.score.toString(),
            inline: true,
          },
          {
            name: "🎯 ADR",
            value: Math.round(
              playerStats.damage_made /
                (matchData.teams.red.rounds_won +
                  matchData.teams.blue.rounds_won)
            ).toString(),
            inline: true,
          },
          {
            name: "🎪 HS%",
            value: `${Math.round(
              (playerStats.stats.headshots /
                (playerStats.stats.headshots +
                  playerStats.stats.bodyshots +
                  playerStats.stats.legshots)) *
                100
            )}%`,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Minseo command error:", error);
      await interaction.editReply({
        content: "❌ An error occurred while fetching minseo's match data.",
      });
    }
  }

  async handleRank(interaction) {
    try {
      const targetPlayer = interaction.options.getUser("player");
      const inputUsername = interaction.options.getString("username");
      const inputTag = interaction.options.getString("tag");

      // Defer reply immediately to prevent timeout
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }

      let username, tag, playerName;

      // Check if username and tag were provided directly
      if (inputUsername && inputTag) {
        username = inputUsername;
        tag = inputTag;
        playerName = `${username}#${tag}`;
      }
      // Check if username is provided but tag is missing
      else if (inputUsername && !inputTag) {
        const errorMsg =
          "❌ Please provide both username and tag. Use `/rank username:TenZ tag:00005`";
        if (interaction.deferred) {
          await interaction.editReply({ content: errorMsg });
        } else {
          await interaction.reply({ content: errorMsg, ephemeral: true });
        }
        return;
      }
      // Check if tag is provided but username is missing
      else if (!inputUsername && inputTag) {
        const errorMsg =
          "❌ Please provide both username and tag. Use `/rank username:TenZ tag:00005`";
        if (interaction.deferred) {
          await interaction.editReply({ content: errorMsg });
        } else {
          await interaction.reply({ content: errorMsg, ephemeral: true });
        }
        return;
      }
      // Try to get account from Discord user (linked or self)
      else {
        const userId = targetPlayer ? targetPlayer.id : interaction.user.id;
        const rankData = await this.valorantTracker.getPlayerMMR(userId);

        if (!rankData.success) {
          const errorMsg = targetPlayer
            ? `❌ ${targetPlayer.username} hasn't linked their Valorant account or ${rankData.error}`
            : `❌ You haven't linked your Valorant account or ${rankData.error}. Use \`/link\` to connect your account, or use \`/rank username:YourName tag:1234\` to check any player.`;

          if (interaction.deferred) {
            await interaction.editReply({ content: errorMsg });
          } else {
            await interaction.reply({ content: errorMsg, ephemeral: true });
          }
          return;
        }

        const data = rankData.data;

        // Determine RR change color and emoji
        let rrChangeText = "";
        let rrColor = 0x95a5a6; // Gray default

        if (data.lastGameChange > 0) {
          rrChangeText = `+${data.lastGameChange} RR`;
          rrColor = 0x27ae60; // Green
        } else if (data.lastGameChange < 0) {
          rrChangeText = `${data.lastGameChange} RR`;
          rrColor = 0xe74c3c; // Red
        } else {
          rrChangeText = "No change";
        }

        // Fun commentary based on rank
        let commentary = "";
        const rank = data.currentRank.toLowerCase();

        if (rank.includes("iron")) {
          commentary = "📉 Still working on the basics, I see...";
        } else if (rank.includes("bronze")) {
          commentary = "🥉 At least it's not Iron anymore!";
        } else if (rank.includes("silver")) {
          commentary = "🥈 Getting there... slowly.";
        } else if (rank.includes("gold")) {
          commentary = "🥇 Solid rank! Now don't throw it away.";
        } else if (rank.includes("platinum")) {
          commentary = "💎 Looking good! Keep climbing.";
        } else if (rank.includes("diamond")) {
          commentary = "💍 Shiny! You're actually decent.";
        } else if (rank.includes("immortal")) {
          commentary = "⚡ Immortal? Touch grass maybe?";
        } else if (rank.includes("radiant")) {
          commentary = "🌟 RADIANT?! Go pro already!";
        }

        const embed = {
          title: `📊 Rank Tracker - ${data.playerName}`,
          description: commentary,
          color: rrColor,
          fields: [
            {
              name: "🏆 Current Rank",
              value: data.currentRank,
              inline: true,
            },
            {
              name: "⚡ Ranked Rating",
              value: `${data.rr}/100 RR`,
              inline: true,
            },
            {
              name: "📈 Last Game",
              value: rrChangeText,
              inline: true,
            },
            {
              name: "🎯 Estimated MMR",
              value: data.mmr ? `${data.mmr} (calculated)` : "Hidden",
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
        };

        if (interaction.deferred) {
          await interaction.editReply({ embeds: [embed] });
        } else {
          await interaction.reply({ embeds: [embed] });
        }
        return;
      }

      // If we reach here, we have username and tag, so use Henrik API directly
      const rankData = await this.valorantTracker.getRankData(username, tag);

      if (!rankData.success) {
        const errorMsg = `❌ ${rankData.error}`;
        if (interaction.deferred) {
          await interaction.editReply({ content: errorMsg });
        } else {
          await interaction.reply({ content: errorMsg, ephemeral: true });
        }
        return;
      }

      const { currentRank, currentRR, mmr, mmrChange, rrChange } = rankData;

      // Fun commentary based on rank
      let commentary = "";
      const rank = currentRank.toLowerCase();

      if (rank.includes("iron")) {
        commentary = "📉 Still working on the basics, I see...";
      } else if (rank.includes("bronze")) {
        commentary = "🥉 At least it's not Iron anymore!";
      } else if (rank.includes("silver")) {
        commentary = "🥈 Getting there... slowly.";
      } else if (rank.includes("gold")) {
        commentary = "🥇 Solid rank! Now don't throw it away.";
      } else if (rank.includes("platinum")) {
        commentary = "💎 Looking good! Keep climbing.";
      } else if (rank.includes("diamond")) {
        commentary = "💍 Shiny! You're actually decent.";
      } else if (rank.includes("immortal")) {
        commentary = "⚡ Immortal? Touch grass maybe?";
      } else if (rank.includes("radiant")) {
        commentary = "🌟 RADIANT?! Go pro already!";
      }

      // Determine color based on RR change
      let rrColor = 0x95a5a6; // Gray default
      if (rrChange > 0) {
        rrColor = 0x27ae60; // Green
      } else if (rrChange < 0) {
        rrColor = 0xe74c3c; // Red
      }

      const embed = {
        title: `📊 Rank Tracker - ${playerName}`,
        description: commentary,
        color: rrColor,
        fields: [
          {
            name: "🏆 Current Rank",
            value: currentRank,
            inline: true,
          },
          {
            name: "⚡ Ranked Rating",
            value: `${currentRR}/100 RR`,
            inline: true,
          },
          {
            name: "📈 Recent Change",
            value: `${rrChange >= 0 ? "+" : ""}${rrChange} RR`,
            inline: true,
          },
          {
            name: "🎯 Estimated MMR",
            value: `${mmr} (calculated)`,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error in handleRank:", error);

      try {
        const errorMsg = "❌ An error occurred while fetching rank data.";
        if (interaction.deferred) {
          await interaction.editReply({ content: errorMsg });
        } else if (!interaction.replied) {
          await interaction.reply({ content: errorMsg, ephemeral: true });
        }
      } catch (interactionError) {
        console.error("Failed to respond to interaction:", interactionError);
      }
    }
  }

  async handleStreak(interaction) {
    const targetPlayer = interaction.options.getUser("player");
    const inputUsername = interaction.options.getString("username");
    const inputTag = interaction.options.getString("tag");

    await interaction.deferReply();

    try {
      let username, tag, playerName;

      // Check if username and tag were provided directly
      if (inputUsername && inputTag) {
        username = inputUsername;
        tag = inputTag;
        playerName = `${username}#${tag}`;
      }
      // Check if username is provided but tag is missing
      else if (inputUsername && !inputTag) {
        await interaction.editReply({
          content:
            "❌ Please provide both username and tag. Use `/streak username:TenZ tag:00005`",
        });
        return;
      }
      // Check if tag is provided but username is missing
      else if (!inputUsername && inputTag) {
        await interaction.editReply({
          content:
            "❌ Please provide both username and tag. Use `/streak username:TenZ tag:00005`",
        });
        return;
      }
      // Try to get account from Discord user (linked or self)
      else {
        const userId = targetPlayer ? targetPlayer.id : interaction.user.id;
        const streakData = await this.valorantTracker.getPlayerStreak(userId);

        if (!streakData.success) {
          if (targetPlayer) {
            await interaction.editReply({
              content: `❌ ${targetPlayer.username} hasn't linked their Valorant account or ${streakData.error}`,
            });
          } else {
            await interaction.editReply({
              content: `❌ You haven't linked your Valorant account or ${streakData.error}. Use \`/link\` to connect your account, or use \`/streak username:YourName tag:1234\` to check any player.`,
            });
          }
          return;
        }

        const data = streakData.data;

        // Generate fun commentary based on streak
        let streakEmoji = "";
        let commentary = "";
        let embedColor = 0x95a5a6; // Gray default

        if (data.streakType === "win") {
          embedColor = 0x27ae60; // Green
          if (data.currentStreak >= 5) {
            streakEmoji = "🔥";
            commentary = `${data.currentStreak} game win streak! You're on fire! 🚀`;
          } else if (data.currentStreak >= 3) {
            streakEmoji = "✨";
            commentary = `${data.currentStreak} wins in a row! Keep it up! 💪`;
          } else {
            streakEmoji = "😊";
            commentary = `${data.currentStreak} win streak! Not bad! 👍`;
          }
        } else {
          embedColor = 0xe74c3c; // Red
          if (data.currentStreak >= 5) {
            streakEmoji = "💀";
            commentary = `${data.currentStreak} game losing streak... Maybe take a break? 😭`;
          } else if (data.currentStreak >= 3) {
            streakEmoji = "😬";
            commentary = `${data.currentStreak} losses in a row. Rough patch! 😰`;
          } else {
            streakEmoji = "😔";
            commentary = `${data.currentStreak} loss streak. It happens! 🤷`;
          }
        }

        // Format recent matches
        const recentMatchesText = data.recentMatches
          .slice(0, 5)
          .map((match, index) => {
            const result = match.won ? "W" : "L";
            const resultEmoji = match.won ? "✅" : "❌";
            return `${resultEmoji} **${result}** - ${match.map} (${match.kda}) - ${match.agent}`;
          })
          .join("\n");

        const embed = {
          title: `${streakEmoji} Streak Tracker - ${data.playerName}`,
          description: commentary,
          color: embedColor,
          fields: [
            {
              name: "🎯 Current Streak",
              value: `${data.currentStreak} ${
                data.streakType === "win" ? "Wins" : "Losses"
              }`,
              inline: true,
            },
            {
              name: "📊 Recent Record",
              value: `${data.recentRecord.wins}W - ${data.recentRecord.losses}L`,
              inline: true,
            },
            {
              name: "🎮 Win Rate",
              value: `${Math.round(
                (data.recentRecord.wins /
                  (data.recentRecord.wins + data.recentRecord.losses)) *
                  100
              )}%`,
              inline: true,
            },
            {
              name: "📋 Recent Matches",
              value: recentMatchesText || "No recent matches found",
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
        };

        await interaction.editReply({
          embeds: [embed],
        });
        return;
      }

      // If we reach here, we have username and tag, so use Henrik API directly
      const streakData = await this.valorantTracker.getStreakData(username, tag);

      if (!streakData.success) {
        await interaction.editReply({
          content: `❌ ${streakData.error}`,
        });
        return;
      }

      const { currentStreak, streakType, recentRecord, recentMatches } =
        streakData;

      // Generate fun commentary based on streak
      let streakEmoji = "";
      let commentary = "";
      let embedColor = 0x95a5a6; // Gray default

      if (streakType === "win") {
        embedColor = 0x27ae60; // Green
        if (currentStreak >= 5) {
          streakEmoji = "🔥";
          commentary = `${currentStreak} game win streak! They're on fire! 🚀`;
        } else if (currentStreak >= 3) {
          streakEmoji = "✨";
          commentary = `${currentStreak} wins in a row! Looking good! 💪`;
        } else {
          streakEmoji = "😊";
          commentary = `${currentStreak} win streak! Not bad! 👍`;
        }
      } else {
        embedColor = 0xe74c3c; // Red
        if (currentStreak >= 5) {
          streakEmoji = "💀";
          commentary = `${currentStreak} game losing streak... Rough times! 😭`;
        } else if (currentStreak >= 3) {
          streakEmoji = "😬";
          commentary = `${currentStreak} losses in a row. Tough patch! 😰`;
        } else {
          streakEmoji = "😔";
          commentary = `${currentStreak} loss streak. It happens! 🤷`;
        }
      }

      // Format recent matches
      const recentMatchesText = recentMatches
        .slice(0, 5)
        .map((match) => {
          const result = match.won ? "W" : "L";
          const resultEmoji = match.won ? "✅" : "❌";
          return `${resultEmoji} **${result}** - ${match.map} (${match.kda}) - ${match.agent}`;
        })
        .join("\n");

      const embed = {
        title: `${streakEmoji} Streak Tracker - ${playerName}`,
        description: commentary,
        color: embedColor,
        fields: [
          {
            name: "🎯 Current Streak",
            value: `${currentStreak} ${
              streakType === "win" ? "Wins" : "Losses"
            }`,
            inline: true,
          },
          {
            name: "📊 Recent Record",
            value: `${recentRecord.wins}W - ${recentRecord.losses}L`,
            inline: true,
          },
          {
            name: "🎮 Win Rate",
            value: `${Math.round(
              (recentRecord.wins / (recentRecord.wins + recentRecord.losses)) *
                100
            )}%`,
            inline: true,
          },
          {
            name: "📋 Recent Matches",
            value: recentMatchesText || "No recent matches found",
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await interaction.editReply({
        embeds: [embed],
      });
    } catch (error) {
      console.error("Error in handleStreak:", error);
      await interaction.editReply({
        content: "❌ An error occurred while fetching streak data.",
      });
    }
  }

  async deployCommands(clientId, token) {
    const rest = new REST().setToken(token);

    try {
      console.log("Started refreshing application (/) commands.");

      await rest.put(Routes.applicationCommands(clientId), {
        body: this.commands,
      });

      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error("Error deploying commands:", error);
    }
  }
}

module.exports = CommandHandler;
