const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

class ValorantTracker {
  constructor() {
    // Using Henrik's Valorant API with API key
    this.baseUrl = "https://api.henrikdev.xyz";
    this.apiKey = process.env.HENRIK_API_KEY;
    this.dataDir = path.join(__dirname, "../../data");
    this.userAccounts = new Map(); // Discord ID -> Riot Account Info

    if (!this.apiKey) {
      console.error("❌ HENRIK_API_KEY not found in environment variables!");
      throw new Error(
        "Henrik API key is required. Please add HENRIK_API_KEY to your .env file."
      );
    }

    console.log(`🌐 Using Henrik's Valorant API with authentication`);

    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadUserAccounts();
    } catch (error) {
      console.error("Error initializing ValorantTracker:", error);
    }
  }

  /**
   * Link a Discord user to their Riot account
   */
  async linkAccount(discordId, gameName, tagLine) {
    try {
      console.log(`🔍 Linking account: ${gameName}#${tagLine}`);
      console.log(
        `🌐 API URL: ${this.baseUrl}/valorant/v1/account/${gameName}/${tagLine}`
      );

      // Test if account exists using Henrik's API
      const response = await axios.get(
        `${this.baseUrl}/valorant/v1/account/${gameName}/${tagLine}`,
        {
          headers: {
            Authorization: this.apiKey,
          },
          timeout: 15000,
        }
      );

      if (response.data.status !== 200) {
        throw new Error(
          `Player ${gameName}#${tagLine} not found. Please check the spelling.`
        );
      }

      const accountData = {
        puuid: response.data.data.puuid,
        gameName: response.data.data.name,
        tagLine: response.data.data.tag,
        region: response.data.data.region,
        accountLevel: response.data.data.account_level,
        linkedAt: new Date(),
      };

      this.userAccounts.set(discordId, accountData);
      await this.saveUserAccounts();

      console.log(`✅ Successfully linked: ${gameName}#${tagLine}`);
      return accountData;
    } catch (error) {
      console.error(`❌ Error linking account:`, error.message);

      if (error.response?.status === 404 || error.code === "ENOTFOUND") {
        throw new Error(
          `Player ${gameName}#${tagLine} not found. Please check the spelling.`
        );
      } else if (error.response?.status === 429) {
        throw new Error(
          "Rate limit exceeded. Please try again in a few minutes."
        );
      } else if (error.code === "ECONNABORTED") {
        throw new Error(
          "Request timeout. The API might be slow. Please try again."
        );
      }
      throw new Error(`Error linking account: ${error.message}`);
    }
  }

  /**
   * Get the latest match for a player with ALL available data
   */
  async getLatestMatchData(discordId) {
    const account = this.userAccounts.get(discordId);
    if (!account) {
      throw new Error("No linked account found. Use `/link` command first.");
    }

    try {
      console.log(
        `🔍 Fetching latest match for: ${account.gameName}#${account.tagLine}`
      );

      // Get match history using Henrik's API (requires region)
      const matchHistoryResponse = await axios.get(
        `${this.baseUrl}/valorant/v3/matches/${account.region}/${account.gameName}/${account.tagLine}`,
        {
          headers: {
            Authorization: this.apiKey,
          },
          timeout: 20000,
        }
      );

      if (matchHistoryResponse.data.status !== 200) {
        throw new Error("No recent matches found for this account.");
      }

      const matches = matchHistoryResponse.data.data;
      if (!matches || matches.length === 0) {
        throw new Error(
          "No matches found for this account. Play some Valorant first!"
        );
      }

      // Get the latest match (first in array)
      const latestMatch = matches[0];

      // Process and enrich the match data
      const processedData = this.processHenrikMatchData(latestMatch, account);

      return processedData;
    } catch (error) {
      console.error("❌ Error fetching match data:", error.message);

      if (error.response?.status === 404) {
        throw new Error("No recent matches found. Play some Valorant first!");
      } else if (error.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      throw new Error(`Error fetching match data: ${error.message}`);
    }
  }

  /**
   * Process Henrik's API match data format
   */
  processHenrikMatchData(matchData, playerAccount) {
    // Find the target player's data
    const player = matchData.players.all_players.find(
      (p) =>
        p.puuid === playerAccount.puuid ||
        (p.name === playerAccount.gameName && p.tag === playerAccount.tagLine)
    );

    if (!player) {
      throw new Error("Player not found in match data.");
    }

    // Basic match info
    const matchInfo = {
      matchId: matchData.metadata.matchid,
      map: matchData.metadata.map,
      gameMode: matchData.metadata.mode,
      gameStart: matchData.metadata.game_start, // Unix timestamp
      gameStartPatched: matchData.metadata.game_start_patched, // Human readable
      gameLength: matchData.metadata.game_length, // Seconds
      rounds: matchData.metadata.rounds_played,
      region: matchData.metadata.region,
      cluster: matchData.metadata.cluster,
    };

    // Player performance data
    const playerStats = {
      name: player.name,
      tag: player.tag,
      team: player.team,
      level: player.level,
      character: player.character,
      puuid: player.puuid,
      stats: {
        score: player.stats.score,
        kills: player.stats.kills,
        deaths: player.stats.deaths,
        assists: player.stats.assists,
        bodyshots: player.stats.bodyshots,
        headshots: player.stats.headshots,
        legshots: player.stats.legshots,
      },
      economy: {
        spent_overall: player.economy.spent.overall,
        spent_average: player.economy.spent.average,
        loadout_average: player.economy.loadout_average,
      },
      ability_casts: player.ability_casts,
    };

    // Team data
    const teams = {
      red: {
        rounds_won: matchData.teams.red.rounds_won,
        rounds_lost: matchData.teams.red.rounds_lost,
        won: matchData.teams.red.has_won,
      },
      blue: {
        rounds_won: matchData.teams.blue.rounds_won,
        rounds_lost: matchData.teams.blue.rounds_lost,
        won: matchData.teams.blue.has_won,
      },
    };

    // All players data for comparison
    const allPlayers = matchData.players.all_players.map((p) => ({
      name: p.name,
      tag: p.tag,
      team: p.team,
      character: p.character,
      level: p.level,
      stats: p.stats,
      economy: p.economy,
    }));

    // Calculate additional statistics
    const calculations = this.calculateAdvancedStatsHenrik(
      player,
      allPlayers,
      teams,
      matchInfo
    );

    return {
      matchInfo,
      playerStats,
      teams,
      allPlayers,
      calculations,
      rawData: matchData, // Include full raw data for debugging
    };
  }

  /**
   * Calculate advanced statistics for Henrik's API data
   */
  calculateAdvancedStatsHenrik(player, allPlayers, teams, matchInfo) {
    const stats = player.stats;

    // Basic ratios
    const kd =
      stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills;
    const kda =
      stats.deaths > 0
        ? ((stats.kills + stats.assists) / stats.deaths).toFixed(2)
        : stats.kills + stats.assists;

    // Performance metrics
    const averageScorePerRound =
      matchInfo.rounds > 0 ? (stats.score / matchInfo.rounds).toFixed(1) : "0";
    const killsPerRound =
      matchInfo.rounds > 0 ? (stats.kills / matchInfo.rounds).toFixed(2) : "0";

    // Accuracy
    const totalShots = stats.bodyshots + stats.headshots + stats.legshots;
    const headshotPercentage =
      totalShots > 0 ? ((stats.headshots / totalShots) * 100).toFixed(1) : "0";

    // Team performance
    const playerTeam = player.team.toLowerCase();
    const teamData = teams[playerTeam];
    const matchResult = teamData
      ? teamData.won
        ? "Victory"
        : "Defeat"
      : "Unknown";

    // Rank among team
    const teamPlayers = allPlayers.filter((p) => p.team === player.team);
    teamPlayers.sort((a, b) => b.stats.kills - a.stats.kills);
    const teamRank =
      teamPlayers.findIndex((p) => p.stats.kills === stats.kills) + 1;

    // Match duration
    const matchDurationMinutes = Math.round(matchInfo.gameLength / 60); // gameLength is in seconds

    return {
      kd,
      kda,
      averageScorePerRound,
      killsPerRound,
      headshotPercentage,
      matchResult,
      teamRank,
      matchDurationMinutes,
      totalShots,
    };
  }

  /**
   * Get all linked accounts for server leaderboards
   */
  async getServerAccounts(serverMembers) {
    const serverAccounts = [];
    for (const [discordId, accountData] of this.userAccounts.entries()) {
      if (serverMembers.includes(discordId)) {
        serverAccounts.push({
          discordId,
          ...accountData,
        });
      }
    }
    return serverAccounts;
  }

  /**
   * Get account info for a Discord user
   */
  getLinkedAccount(discordId) {
    return this.userAccounts.get(discordId);
  }

  /**
   * Remove linked account
   */
  async unlinkAccount(discordId) {
    const removed = this.userAccounts.delete(discordId);
    if (removed) {
      await this.saveUserAccounts();
    }
    return removed;
  }

  // Data persistence methods
  async saveUserAccounts() {
    try {
      const filePath = path.join(this.dataDir, "userAccounts.json");
      const data = Object.fromEntries(this.userAccounts);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving user accounts:", error);
    }
  }

  async loadUserAccounts() {
    try {
      const filePath = path.join(this.dataDir, "userAccounts.json");
      const data = await fs.readFile(filePath, "utf-8");
      const parsedData = JSON.parse(data);
      this.userAccounts = new Map(Object.entries(parsedData));
      console.log(`✅ Loaded ${this.userAccounts.size} linked accounts`);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("Error loading user accounts:", error);
      }
    }
  }
}

module.exports = ValorantTracker;
