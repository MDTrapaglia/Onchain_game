import { prisma } from '../config/prisma.js';
import type { Player } from '@prisma/client';

class PlayerService {
  /**
   * Create a new player
   */
  async create(data: {
    wallet_address: string;
    nft_policy_id: string;
    nft_asset_name: string;
    nft_tx_hash?: string;
    stake_address?: string;
    script_address?: string;
  }): Promise<Player> {
    return await prisma.player.create({
      data: {
        wallet_address: data.wallet_address,
        nft_policy_id: data.nft_policy_id,
        nft_asset_name: data.nft_asset_name,
        nft_tx_hash: data.nft_tx_hash,
        stake_address: data.stake_address,
        script_address: data.script_address,
      },
    });
  }

  /**
   * Get player by wallet address
   */
  async getByWallet(wallet_address: string): Promise<Player | null> {
    return await prisma.player.findUnique({
      where: { wallet_address },
    });
  }

  /**
   * Get player by NFT
   */
  async getByNFT(nft_policy_id: string, nft_asset_name: string): Promise<Player | null> {
    return await prisma.player.findUnique({
      where: {
        nft_policy_id_nft_asset_name: {
          nft_policy_id,
          nft_asset_name,
        },
      },
    });
  }

  /**
   * Get player by ID
   */
  async getById(id: string): Promise<Player | null> {
    return await prisma.player.findUnique({
      where: { id },
    });
  }

  /**
   * Update player stats
   */
  async updateStats(
    id: string,
    stats: {
      current_hp: number;
      current_exp: number;
      current_agility: number;
      current_strength: number;
      current_intelligence: number;
      current_speed: number;
    }
  ): Promise<Player> {
    return await prisma.player.update({
      where: { id },
      data: {
        ...stats,
        last_played_at: new Date(),
      },
    });
  }

  /**
   * Update player session info
   */
  async updateSessionInfo(
    id: string,
    data: {
      current_session_id?: number;
      total_sessions?: number;
      is_playing?: boolean;
    }
  ): Promise<Player> {
    return await prisma.player.update({
      where: { id },
      data,
    });
  }

  /**
   * Set player playing status
   */
  async setPlaying(id: string, is_playing: boolean): Promise<Player> {
    return await prisma.player.update({
      where: { id },
      data: { is_playing },
    });
  }

  /**
   * Get all active players
   */
  async getActive(limit: number = 100): Promise<Player[]> {
    return await prisma.player.findMany({
      where: { is_active: true },
      orderBy: { last_played_at: 'desc' },
      take: limit,
    });
  }

  /**
   * Get players currently in game
   */
  async getCurrentlyPlaying(): Promise<Player[]> {
    return await prisma.player.findMany({
      where: { is_playing: true },
      include: {
        sessions: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });
  }
}

export const playerService = new PlayerService();
