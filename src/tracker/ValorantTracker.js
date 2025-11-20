const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

class ValorantTracker {
  constructor() {
    this.apiKey = process.env.RIOT_API_KEY;
    this.baseUrl = "https://na.api.riotgames.com";
    this.valorantUrl = "https://na.api.riotgames.com/val";
    this.dataDir = path.join(__dirname, "../../data");
    this.userAccounts = new Map(); // Discord ID -> Riot Account Info

    // Debug logging
    console.log(`🔑 API Key loaded: ${this.apiKey ? "Yes" : "No"}`);
    if (this.apiKey) {
      console.log(`🔑 API Key starts with: ${this.apiKey.substring(0, 10)}...`);
    }

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
    if (!this.apiKey) {
      throw new Error(
        "Riot API key not configured. Please add RIOT_API_KEY to your .env file."
      );
    }

    try {
      // Get PUUID from Riot ID
      console.log(
        `🔍 Attempting API call: ${this.baseUrl}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`
      );
      console.log(
        `🔑 Using API Key: ${
          this.apiKey ? this.apiKey.substring(0, 15) + "..." : "MISSING"
        }`
      );

      const response = await axios.get(
        `${this.baseUrl}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
        {
          headers: { "X-Riot-Token": this.apiKey },
          timeout: 10000,
        }
      );

      console.log(`✅ API call successful for ${gameName}#${tagLine}`);

      const accountData = {
        puuid: response.data.puuid,
        gameName: response.data.gameName,
        tagLine: response.data.tagLine,
        linkedAt: new Date(),
      };

      this.userAccounts.set(discordId, accountData);
      await this.saveUserAccounts();

      return accountData;
    } catch (error) {
      console.error(`❌ API Error for ${gameName}#${tagLine}:`);
      console.error(`Status: ${error.response?.status || "No response"}`);
      console.error(
        `Response: ${JSON.stringify(error.response?.data || "No data")}`
      );
      console.error(`Full error: ${error.message}`);

      if (error.response?.status === 404) {
        throw new Error(
          `Player ${gameName}#${tagLine} not found. Please check the spelling.`
        );
      } else if (error.response?.status === 403) {
        throw new Error("API key is invalid or expired.");
      } else if (error.response?.status === 429) {
        throw new Error(
          "Rate limit exceeded. Please try again in a few minutes."
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

    if (!this.apiKey) {
      throw new Error("Riot API key not configured.");
    }

    try {
      // Get recent matches
      const matchHistoryResponse = await axios.get(
        `${this.valorantUrl}/match/v1/matchlists/by-puuid/${account.puuid}`,
        {
          headers: { "X-Riot-Token": this.apiKey },
          timeout: 15000,
        }
      );

      const matchHistory = matchHistoryResponse.data.history;
      if (matchHistory.length === 0) {
        throw new Error("No matches found for this account.");
      }

      // Get detailed data for the latest match
      const latestMatchId = matchHistory[0].matchId;
      const matchDetailsResponse = await axios.get(
        `${this.valorantUrl}/match/v1/matches/${latestMatchId}`,
        {
          headers: { "X-Riot-Token": this.apiKey },
          timeout: 15000,
        }
      );

      const matchData = matchDetailsResponse.data;

      // Process and enrich the match data
      const processedData = this.processMatchData(matchData, account.puuid);

      return processedData;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error("API key is invalid or expired.");
      } else if (error.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      throw new Error(`Error fetching match data: ${error.message}`);
    }
  }

  /**
   * Process and extract ALL available match data
   */
  processMatchData(matchData, playerPuuid) {
    // Find the target player's data
    const player = matchData.players.find((p) => p.puuid === playerPuuid);
    if (!player) {
      throw new Error("Player not found in match data.");
    }

    // Basic match info
    const matchInfo = {
      matchId: matchData.matchInfo.matchId,
      mapId: matchData.matchInfo.mapId,
      mapName: this.getMapName(matchData.matchInfo.mapId),
      gameLengthMillis: matchData.matchInfo.gameLengthMillis,
      gameStartMillis: matchData.matchInfo.gameStartMillis,
      provisioningFlowId: matchData.matchInfo.provisioningFlowId,
      isCompleted: matchData.matchInfo.isCompleted,
      customGameName: matchData.matchInfo.customGameName,
      queueId: matchData.matchInfo.queueId,
      gameMode: matchData.matchInfo.gameMode,
      isRanked: matchData.matchInfo.isRanked,
      seasonId: matchData.matchInfo.seasonId,
    };

    // Player performance data
    const playerStats = {
      puuid: player.puuid,
      gameName: player.gameName,
      tagLine: player.tagLine,
      teamId: player.teamId,
      characterId: player.characterId,
      agentName: this.getAgentName(player.characterId),
      playerCard: player.playerCard,
      playerTitle: player.playerTitle,
      stats: {
        score: player.stats.score,
        roundsPlayed: player.stats.roundsPlayed,
        kills: player.stats.kills,
        deaths: player.stats.deaths,
        assists: player.stats.assists,
        playtimeMillis: player.stats.playtimeMillis,
        abilityCasts: player.stats.abilityCasts,
      },
      competitiveTier: player.competitiveTier,
      playerCard: player.playerCard,
      playerTitle: player.playerTitle,
    };

    // Team data
    const teams = matchData.teams.map((team) => ({
      teamId: team.teamId,
      won: team.won,
      roundsPlayed: team.roundsPlayed,
      roundsWon: team.roundsWon,
      numPoints: team.numPoints,
    }));

    // All players data for comparison
    const allPlayers = matchData.players.map((p) => ({
      gameName: p.gameName,
      tagLine: p.tagLine,
      teamId: p.teamId,
      characterId: p.characterId,
      agentName: this.getAgentName(p.characterId),
      stats: p.stats,
      competitiveTier: p.competitiveTier,
    }));

    // Round results (if available)
    const rounds = matchData.roundResults
      ? matchData.roundResults.map((round, index) => ({
          roundNum: index + 1,
          roundResult: round.roundResult,
          roundCeremony: round.roundCeremony,
          winningTeam: round.winningTeam,
          bombPlanter: round.bombPlanter,
          bombDefuser: round.bombDefuser,
          plantRoundTime: round.plantRoundTime,
          plantPlayerLocations: round.plantPlayerLocations,
          plantLocation: round.plantLocation,
          plantSite: round.plantSite,
          defuseRoundTime: round.defuseRoundTime,
          defusePlayerLocations: round.defusePlayerLocations,
          defuseLocation: round.defuseLocation,
          playerStats: round.playerStats,
          roundResultCode: round.roundResultCode,
        }))
      : [];

    // Calculate additional statistics
    const calculations = this.calculateAdvancedStats(
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
      rounds,
      calculations,
      rawData: matchData, // Include full raw data for debugging
    };
  }

  /**
   * Calculate advanced statistics
   */
  calculateAdvancedStats(player, allPlayers, teams, matchInfo) {
    const stats = player.stats;

    // Basic ratios
    const kd =
      stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills;
    const kda =
      stats.deaths > 0
        ? ((stats.kills + stats.assists) / stats.deaths).toFixed(2)
        : stats.kills + stats.assists;

    // Performance metrics
    const averageDamagePerRound =
      stats.roundsPlayed > 0
        ? (stats.score / stats.roundsPlayed).toFixed(1)
        : "0";
    const killsPerRound =
      stats.roundsPlayed > 0
        ? (stats.kills / stats.roundsPlayed).toFixed(2)
        : "0";

    // Team performance
    const playerTeam = teams.find((t) => t.teamId === player.teamId);
    const matchResult = playerTeam
      ? playerTeam.won
        ? "Victory"
        : "Defeat"
      : "Unknown";

    // Rank among team
    const teamPlayers = allPlayers.filter((p) => p.teamId === player.teamId);
    teamPlayers.sort((a, b) => b.stats.kills - a.stats.kills);
    const teamRank =
      teamPlayers.findIndex((p) => p.stats.kills === stats.kills) + 1;

    // Match duration
    const matchDurationMinutes = Math.round(matchInfo.gameLengthMillis / 60000);

    return {
      kd,
      kda,
      averageDamagePerRound,
      killsPerRound,
      matchResult,
      teamRank,
      matchDurationMinutes,
      playtimeMinutes: Math.round(stats.playtimeMillis / 60000),
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

  // Helper methods for converting IDs to names
  getMapName(mapId) {
    const maps = {
      "/Game/Maps/Ascent/Ascent": "Ascent",
      "/Game/Maps/Bind/Bind": "Bind",
      "/Game/Maps/Haven/Haven": "Haven",
      "/Game/Maps/Split/Split": "Split",
      "/Game/Maps/Icebox/Icebox": "Icebox",
      "/Game/Maps/Breeze/Breeze": "Breeze",
      "/Game/Maps/Fracture/Fracture": "Fracture",
      "/Game/Maps/Pearl/Pearl": "Pearl",
      "/Game/Maps/Lotus/Lotus": "Lotus",
      "/Game/Maps/Sunset/Sunset": "Sunset",
      "/Game/Maps/Abyss/Abyss": "Abyss",
    };
    return maps[mapId] || mapId.split("/").pop();
  }

  getAgentName(characterId) {
    const agents = {
      "ddd6c8dc-4db6-4f1b-a58e-ba8c39e94bb5": "Phoenix",
      "5f8d3a7f-467b-97f3-062c-13acf203c006": "Breach",
      "6f2a04ca-43e0-be17-7f36-b3908627744d": "Skye",
      "117ed9e3-49f3-6512-3ccf-0cada7e3823b": "Cypher",
      "320b2a48-4d9b-a075-30f1-1f93a9b638fa": "Sova",
      "1e58de9c-4950-5125-93e9-a0aee9f98746": "Killjoy",
      "95b78ed7-4637-86d9-7e41-71ba8c293152": "Harbor",
      "8e253930-4c05-31dd-1b6c-968525494517": "Omen",
      "eb93336a-449b-9c1b-0a54-a891f7921d69": "Brimstone",
      "41fb69c1-4189-7b37-f117-bcaf1e96f1bf": "Astra",
      "9f0d8ba9-4140-b941-57d3-a7ad57c6b417": "Brimstone",
      "707eab51-4836-f488-046a-cda6bf494859": "Viper",
      "22697a3d-b88e-55f3-95c4-57e8a88d8f9e": "Chamber",
      "569fdd95-4d10-43ab-ca70-79becc718b46": "Sage",
      "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc": "Reyna",
      "add6443a-41bd-e414-f6ad-e58d267f4e95": "Jett",
      "f94c3b30-42be-e959-889c-5aa313dba261": "Raze",
      "7f94d92c-4234-0a36-9646-3a87eb8b5c89": "Yoru",
      "e370fa57-4757-3604-3648-499e1f642d3f": "Gekko",
      "bb2a4828-46eb-8cd1-e765-15848195d751B": "Neon",
      "dade69b4-4f5a-8528-247b-219e5a1facd6": "Fade",
      "601dbbe7-43ce-be57-2a40-4abd24953621": "KAY/O",
      "6665c8e6-4e9e-4b14-88d9-fa4adcead099": "Deadlock",
      "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235": "Iso",
      "1dbf2edd-7682-4fa6-bc2d-4b3b4e4bbfe2": "Clove",
      "efba5359-af36-4eb6-b4e3-ce80dc1f592e": "Vyse",
    };
    return agents[characterId] || "Unknown Agent";
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
