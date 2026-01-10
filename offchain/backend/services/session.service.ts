import { prisma } from '../config/prisma.js';
import type { GameSession, GameSessionStatus } from '@prisma/client';
import type { PlayerStats } from '../types/index.js';

class SessionService {
  /**
   * Create a new game session
   */
  async create(data: {
    player_id: string;
    session_number: number;
    start_stats: PlayerStats;
    start_tx_id?: string;
  }): Promise<GameSession> {
    return await prisma.gameSession.create({
      data: {
        player_id: data.player_id,
        session_number: data.session_number,
        status: 'ACTIVE',
        start_hp: data.start_stats.hp,
        start_exp: data.start_stats.exp,
        start_agility: data.start_stats.agility,
        start_strength: data.start_stats.strength,
        start_intelligence: data.start_stats.intelligence,
        start_speed: data.start_stats.speed,
        start_tx_id: data.start_tx_id,
      },
    });
  }

  /**
   * Get session by ID
   */
  async getById(id: string): Promise<GameSession | null> {
    return await prisma.gameSession.findUnique({
      where: { id },
      include: {
        player: true,
        transactions: true,
      },
    });
  }

  /**
   * Get active session for player
   */
  async getActiveSession(player_id: string): Promise<GameSession | null> {
    return await prisma.gameSession.findFirst({
      where: {
        player_id,
        status: 'ACTIVE',
      },
      include: {
        player: true,
      },
    });
  }

  /**
   * Update session status
   */
  async updateStatus(id: string, status: GameSessionStatus): Promise<GameSession> {
    return await prisma.gameSession.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Finalize session with final stats
   */
  async finalize(
    id: string,
    data: {
      final_stats: PlayerStats;
      signature: string;
      message: string;
      finalize_tx_id?: string;
    }
  ): Promise<GameSession> {
    return await prisma.gameSession.update({
      where: { id },
      data: {
        status: 'FINALIZING',
        end_hp: data.final_stats.hp,
        end_exp: data.final_stats.exp,
        end_agility: data.final_stats.agility,
        end_strength: data.final_stats.strength,
        end_intelligence: data.final_stats.intelligence,
        end_speed: data.final_stats.speed,
        final_signature: data.signature,
        final_message: data.message,
        finalize_tx_id: data.finalize_tx_id,
        finalized_at: new Date(),
      },
    });
  }

  /**
   * Mark session as completed
   */
  async complete(id: string): Promise<GameSession> {
    return await prisma.gameSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
    });
  }

  /**
   * Mark session as failed
   */
  async fail(id: string): Promise<GameSession> {
    return await prisma.gameSession.update({
      where: { id },
      data: {
        status: 'FAILED',
      },
    });
  }

  /**
   * Get sessions by player
   */
  async getByPlayer(
    player_id: string,
    limit: number = 10
  ): Promise<GameSession[]> {
    return await prisma.gameSession.findMany({
      where: { player_id },
      orderBy: { started_at: 'desc' },
      take: limit,
      include: {
        transactions: true,
      },
    });
  }

  /**
   * Get sessions by status
   */
  async getByStatus(
    status: GameSessionStatus,
    limit: number = 100
  ): Promise<GameSession[]> {
    return await prisma.gameSession.findMany({
      where: { status },
      orderBy: { started_at: 'desc' },
      take: limit,
      include: {
        player: true,
      },
    });
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    const [total, active, completed, failed] = await Promise.all([
      prisma.gameSession.count(),
      prisma.gameSession.count({ where: { status: 'ACTIVE' } }),
      prisma.gameSession.count({ where: { status: 'COMPLETED' } }),
      prisma.gameSession.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      total,
      active,
      completed,
      failed,
    };
  }
}

export const sessionService = new SessionService();
