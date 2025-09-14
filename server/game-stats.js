const { db } = require('./database');
const { users, user_stats, game_sessions } = require('../shared/schema');
const { eq } = require('drizzle-orm');

class GameStatsService {
  constructor() {
    this.activeSessions = new Map(); // socketId -> session data
  }

  // Start a game session for a player
  async startGameSession(socketId, userId, gameMode = 'battle_royale') {
    try {
      const sessionData = {
        userId,
        gameMode,
        startTime: new Date(),
        kills: 0,
        deaths: 0,
        damageDealt: 0,
        survivalTime: 0,
        coinsEarned: 0,
        experienceEarned: 0
      };

      this.activeSessions.set(socketId, sessionData);
      
      console.log(`Game session started for user ${userId}`);
      return sessionData;
    } catch (error) {
      console.error('Error starting game session:', error);
      return null;
    }
  }

  // Record a kill for a player
  async recordKill(killerSocketId, victimSocketId) {
    try {
      const killerSession = this.activeSessions.get(killerSocketId);
      const victimSession = this.activeSessions.get(victimSocketId);

      if (killerSession) {
        killerSession.kills++;
        killerSession.coinsEarned += 50; // 50 coins per kill
        killerSession.experienceEarned += 100; // 100 XP per kill
      }

      if (victimSession) {
        victimSession.deaths++;
      }

      console.log(`Kill recorded: ${killerSocketId} -> ${victimSocketId}`);
    } catch (error) {
      console.error('Error recording kill:', error);
    }
  }

  // Record damage dealt
  recordDamage(socketId, damage) {
    try {
      const session = this.activeSessions.get(socketId);
      if (session) {
        session.damageDealt += damage;
      }
    } catch (error) {
      console.error('Error recording damage:', error);
    }
  }

  // End game session and update database
  async endGameSession(socketId, placement = null) {
    try {
      const session = this.activeSessions.get(socketId);
      if (!session) return;

      // Set placement in session for database persistence
      session.placement = placement;

      // Calculate survival time
      session.survivalTime = Math.floor((new Date() - session.startTime) / 1000);

      // Bonus rewards based on placement
      if (placement) {
        if (placement === 1) {
          session.coinsEarned += 500; // Winner bonus
          session.experienceEarned += 1000; // Winner XP
        } else if (placement <= 3) {
          session.coinsEarned += 250; // Top 3 bonus
          session.experienceEarned += 500; // Top 3 XP
        } else if (placement <= 10) {
          session.coinsEarned += 100; // Top 10 bonus
          session.experienceEarned += 200; // Top 10 XP
        }
      }

      // Base survival rewards (coins per minute survived)
      const survivalMinutes = Math.floor(session.survivalTime / 60);
      session.coinsEarned += survivalMinutes * 10;
      session.experienceEarned += survivalMinutes * 25;

      // Update user stats and coins in database
      await this.updateUserStats(session);
      await this.saveGameSession(session, placement);

      // Remove from active sessions
      this.activeSessions.delete(socketId);

      console.log(`Game session ended for user ${session.userId}: ${session.kills} kills, ${session.deaths} deaths, ${session.coinsEarned} coins earned`);
      
      return {
        coinsEarned: session.coinsEarned,
        experienceEarned: session.experienceEarned,
        kills: session.kills,
        deaths: session.deaths,
        survivalTime: session.survivalTime
      };
    } catch (error) {
      console.error('Error ending game session:', error);
      return null;
    }
  }

  // Update user stats in database
  async updateUserStats(session) {
    try {
      // Get current user stats
      const [currentStats] = await db.select().from(user_stats).where(eq(user_stats.user_id, session.userId)).limit(1);

      if (currentStats) {
        // Update existing stats
        const gamesWon = session.placement === 1 ? currentStats.games_won + 1 : currentStats.games_won;
        await db.update(user_stats).set({
          kills: currentStats.kills + session.kills,
          deaths: currentStats.deaths + session.deaths,
          games_played: currentStats.games_played + 1,
          games_won: gamesWon,
          total_damage: currentStats.total_damage + session.damageDealt,
          time_played: currentStats.time_played + session.survivalTime,
          total_coins_earned: currentStats.total_coins_earned + session.coinsEarned,
          updated_at: new Date()
        }).where(eq(user_stats.user_id, session.userId));
      } else {
        // Create new stats record for first-time player
        const gamesWon = session.placement === 1 ? 1 : 0;
        await db.insert(user_stats).values({
          user_id: session.userId,
          kills: session.kills,
          deaths: session.deaths,
          games_played: 1,
          games_won: gamesWon,
          total_damage: session.damageDealt,
          time_played: session.survivalTime,
          total_coins_earned: session.coinsEarned,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      // Update user coins and experience
      const [currentUser] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
      
      if (currentUser) {
        const newCoins = currentUser.coins + session.coinsEarned;
        const newExperience = currentUser.experience + session.experienceEarned;
        
        // Calculate new level (100 XP per level for simplicity)
        const newLevel = Math.floor(newExperience / 100) + 1;

        await db.update(users).set({
          coins: newCoins,
          experience: newExperience,
          level: newLevel,
          updated_at: new Date()
        }).where(eq(users.id, session.userId));

        return { newCoins, newExperience, newLevel };
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
      return null;
    }
  }

  // Save game session to database
  async saveGameSession(session, placement) {
    try {
      await db.insert(game_sessions).values({
        user_id: session.userId,
        game_mode_id: 1, // Default to battle royale for now
        kills: session.kills,
        deaths: session.deaths,
        damage_dealt: session.damageDealt,
        survival_time: session.survivalTime,
        placement: placement,
        coins_earned: session.coinsEarned,
        experience_earned: session.experienceEarned,
        started_at: session.startTime,
        ended_at: new Date()
      });
    } catch (error) {
      console.error('Error saving game session:', error);
    }
  }

  // Get user stats for display
  async getUserStats(userId) {
    try {
      const [stats] = await db.select().from(user_stats).where(eq(user_stats.user_id, userId)).limit(1);
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      return {
        user: {
          username: user?.username,
          level: user?.level,
          coins: user?.coins,
          experience: user?.experience
        },
        stats: {
          kills: stats?.kills || 0,
          deaths: stats?.deaths || 0,
          gamesPlayed: stats?.games_played || 0,
          totalDamage: stats?.total_damage || 0,
          timePlayed: stats?.time_played || 0,
          kd: stats?.deaths > 0 ? (stats.kills / stats.deaths) : stats?.kills || 0
        }
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  // Clean up session on disconnect
  cleanupSession(socketId) {
    if (this.activeSessions.has(socketId)) {
      // End session with no placement (disconnected)
      this.endGameSession(socketId, null);
    }
  }
}

module.exports = GameStatsService;