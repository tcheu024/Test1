const axios = require("axios");

class ValorantAPI {
  constructor() {
    this.apiKey = process.env.RIOT_API_KEY;
    this.baseUrl = "https://na.api.riotgames.com";
    this.valorantUrl = "https://na.api.riotgames.com/val";
  }

  /**
   * Get player's recent matches
   * @param {string} puuid - Player's PUUID
   * @returns {Array} Recent matches
   */
  async getRecentMatches(puuid) {
    if (!this.apiKey) {
      throw new Error("Riot API key not configured");
    }

    try {
      const response = await axios.get(
        `${this.valorantUrl}/match/v1/matchlists/by-puuid/${puuid}`,
        {
          headers: { "X-Riot-Token": this.apiKey },
        }
      );
      return response.data.history;
    } catch (error) {
      console.error(
        "Error fetching recent matches:",
        error.response?.data || error.message
      );
      return [];
    }
  }

  /**
   * Get match details
   * @param {string} matchId
   * @returns {Object} Match details
   */
  async getMatchDetails(matchId) {
    if (!this.apiKey) {
      throw new Error("Riot API key not configured");
    }

    try {
      const response = await axios.get(
        `${this.valorantUrl}/match/v1/matches/${matchId}`,
        {
          headers: { "X-Riot-Token": this.apiKey },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching match details:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Get player PUUID by Riot ID
   * @param {string} gameName
   * @param {string} tagLine
   * @returns {string} PUUID
   */
  async getPUUID(gameName, tagLine) {
    if (!this.apiKey) {
      throw new Error("Riot API key not configured");
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
        {
          headers: { "X-Riot-Token": this.apiKey },
        }
      );
      return response.data.puuid;
    } catch (error) {
      console.error(
        "Error fetching PUUID:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Validate if a player achieved specific challenges based on recent matches
   * @param {string} puuid
   * @param {Array} challenges
   * @returns {Object} Validation results
   */
  async validateChallenges(puuid, challenges) {
    const results = {};

    try {
      const recentMatches = await this.getRecentMatches(puuid);

      for (const matchInfo of recentMatches.slice(0, 5)) {
        // Check last 5 matches
        const matchDetails = await this.getMatchDetails(matchInfo.matchId);
        if (!matchDetails) continue;

        const playerStats = this.findPlayerStats(matchDetails, puuid);
        if (!playerStats) continue;

        // Check various challenges
        results[matchInfo.matchId] = this.checkMatchChallenges(
          matchDetails,
          playerStats,
          challenges
        );
      }
    } catch (error) {
      console.error("Error validating challenges:", error);
    }

    return results;
  }

  /**
   * Find player stats in match data
   * @param {Object} matchData
   * @param {string} puuid
   * @returns {Object} Player stats
   */
  findPlayerStats(matchData, puuid) {
    for (const player of matchData.players) {
      if (player.puuid === puuid) {
        return player;
      }
    }
    return null;
  }

  /**
   * Check which challenges were completed in a match
   * @param {Object} matchData
   * @param {Object} playerStats
   * @param {Array} challenges
   * @returns {Object} Challenge completion status
   */
  checkMatchChallenges(matchData, playerStats, challenges) {
    const completedChallenges = {};

    const stats = playerStats.stats;
    const kills = stats.kills;
    const deaths = stats.deaths;
    const assists = stats.assists;
    const score = stats.score;

    // Common challenge checks
    if (kills >= 5) completedChallenges["5_kills"] = true;
    if (kills >= 10) completedChallenges["10_kills"] = true;
    if (kills >= 20) completedChallenges["20_kills"] = true;

    // Check for ace (5 kills in one round)
    if (this.checkForAce(matchData, playerStats.puuid)) {
      completedChallenges["ace"] = true;
    }

    // Check win condition
    const team = playerStats.teamId;
    const winningTeam = matchData.teams.find((t) => t.won)?.teamId;
    if (team === winningTeam) {
      completedChallenges["win_match"] = true;
    }

    // Check agent-specific challenges
    const agentName = playerStats.characterId;
    completedChallenges["agent_used"] = agentName;

    // Check map
    const mapName = matchData.matchInfo.mapId;
    completedChallenges["map_played"] = mapName;

    return completedChallenges;
  }

  /**
   * Check if player got an ace in any round
   * @param {Object} matchData
   * @param {string} puuid
   * @returns {boolean}
   */
  checkForAce(matchData, puuid) {
    // This would require more detailed round data
    // For now, we'll use a simplified check based on kills
    const playerStats = this.findPlayerStats(matchData, puuid);

    // Simplified ace detection (not perfect, would need round-by-round data)
    return (
      playerStats.stats.kills >= 5 &&
      this.hasHighKillsPerRound(playerStats.stats)
    );
  }

  /**
   * Helper to estimate high kills per round
   * @param {Object} stats
   * @returns {boolean}
   */
  hasHighKillsPerRound(stats) {
    // Rough estimation - this would be better with actual round data
    return stats.kills > stats.deaths * 2;
  }

  /**
   * Get player rank information
   * @param {string} puuid
   * @returns {Object} Rank info
   */
  async getPlayerRank(puuid) {
    if (!this.apiKey) {
      throw new Error("Riot API key not configured");
    }

    try {
      const response = await axios.get(
        `${this.valorantUrl}/ranked/v1/leaderboards/by-act/d929bc38-4ab6-7da4-94f0-ee84f8ac141e`,
        {
          headers: { "X-Riot-Token": this.apiKey },
        }
      );

      // This endpoint returns leaderboard data, not individual rank
      // For individual rank, you'd need the player's match history and extract rank from there
      return null;
    } catch (error) {
      console.error(
        "Error fetching rank:",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

module.exports = ValorantAPI;
