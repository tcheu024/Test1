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
      const playerStats = data.stats.find((p) => p.puuid === data.playerPuuid);

      if (!playerStats) {
        await interaction.editReply({
          content: "❌ Could not find your stats in the match data.",
        });
        return;
      }

      // Create comprehensive match embed
      const embed = {
        title: `🎯 Latest Match Stats - ${playerStats.name}#${playerStats.tag}`,
        description: `**${data.metadata.map}** | ${data.metadata.mode} | ${
          data.metadata.started_at
            ? new Date(data.metadata.started_at * 1000).toLocaleString()
            : "Unknown time"
        }`,
        color: playerStats.team === data.teams.red.won ? 0xff6b6b : 0x4dabf7,
        fields: [
          {
            name: "🏆 Match Result",
            value: `${
              playerStats.team === data.teams.red.won ? "Victory" : "Defeat"
            } (${data.teams.red.rounds_won}-${data.teams.blue.rounds_won})`,
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
            name: "🎯 Damage Stats",
            value: `**Damage Dealt:** ${
              playerStats.damage_made || 0
            } | **Damage Received:** ${playerStats.damage_received || 0}`,
            inline: false,
          },
          {
            name: "🎪 Economy",
            value: `**Money Spent:** ${
              playerStats.economy?.spent?.overall || 0
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
