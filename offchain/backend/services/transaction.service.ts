import { prisma } from '../config/prisma.js';
import type {
  GameTransaction,
  GameTransactionStatus,
  GameTransactionType,
} from '@prisma/client';

class TransactionService {
  /**
   * Create a new transaction record
   */
  async create(data: {
    player_id: string;
    session_id?: string;
    type: GameTransactionType;
    nft_policy_id: string;
    nft_asset_name: string;
    tx_hash?: string;
    tx_cbor?: string;
    datum_json?: any;
  }): Promise<GameTransaction> {
    return await prisma.gameTransaction.create({
      data: {
        player_id: data.player_id,
        session_id: data.session_id,
        type: data.type,
        nft_policy_id: data.nft_policy_id,
        nft_asset_name: data.nft_asset_name,
        tx_hash: data.tx_hash,
        tx_cbor: data.tx_cbor,
        datum_json: data.datum_json,
        status: 'PENDING',
      },
    });
  }

  /**
   * Get transaction by ID
   */
  async getById(id: string): Promise<GameTransaction | null> {
    return await prisma.gameTransaction.findUnique({
      where: { id },
      include: {
        player: true,
        session: true,
      },
    });
  }

  /**
   * Get transaction by hash
   */
  async getByHash(tx_hash: string): Promise<GameTransaction | null> {
    return await prisma.gameTransaction.findUnique({
      where: { tx_hash },
      include: {
        player: true,
        session: true,
      },
    });
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    id: string,
    status: GameTransactionStatus,
    status_message?: string
  ): Promise<GameTransaction> {
    return await prisma.gameTransaction.update({
      where: { id },
      data: {
        status,
        status_message,
        last_checked_at: new Date(),
      },
    });
  }

  /**
   * Mark transaction as confirmed
   */
  async confirm(
    id: string,
    data: {
      block_height?: number;
      block_time?: Date;
      slot?: number;
      utxo_tx_hash?: string;
      utxo_index?: number;
    }
  ): Promise<GameTransaction> {
    return await prisma.gameTransaction.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmed_at: new Date(),
        block_height: data.block_height,
        block_time: data.block_time,
        slot: data.slot,
        utxo_tx_hash: data.utxo_tx_hash,
        utxo_index: data.utxo_index,
        last_checked_at: new Date(),
      },
    });
  }

  /**
   * Mark transaction for retry
   */
  async retry(id: string): Promise<GameTransaction> {
    const tx = await prisma.gameTransaction.findUnique({
      where: { id },
    });

    if (!tx) {
      throw new Error('Transaction not found');
    }

    if (tx.retry_count >= tx.max_retries) {
      return await prisma.gameTransaction.update({
        where: { id },
        data: {
          status: 'FAILED',
          status_message: 'Max retries exceeded',
        },
      });
    }

    return await prisma.gameTransaction.update({
      where: { id },
      data: {
        status: 'RETRYING',
        retry_count: tx.retry_count + 1,
        next_retry_at: new Date(Date.now() + 60000), // 1 minute
      },
    });
  }

  /**
   * Get transactions by player
   */
  async getByPlayer(player_id: string, limit: number = 100): Promise<GameTransaction[]> {
    return await prisma.gameTransaction.findMany({
      where: { player_id },
      orderBy: { submitted_at: 'desc' },
      take: limit,
      include: {
        session: true,
      },
    });
  }

  /**
   * Get transactions by session
   */
  async getBySession(session_id: string): Promise<GameTransaction[]> {
    return await prisma.gameTransaction.findMany({
      where: { session_id },
      orderBy: { submitted_at: 'asc' },
      include: {
        player: true,
      },
    });
  }

  /**
   * Get transactions by status
   */
  async getByStatus(
    status: GameTransactionStatus,
    limit: number = 100
  ): Promise<GameTransaction[]> {
    return await prisma.gameTransaction.findMany({
      where: { status },
      orderBy: { submitted_at: 'desc' },
      take: limit,
      include: {
        player: true,
        session: true,
      },
    });
  }

  /**
   * Get pending transactions that need checking
   */
  async getPendingForCheck(): Promise<GameTransaction[]> {
    return await prisma.gameTransaction.findMany({
      where: {
        status: 'PENDING',
        tx_hash: { not: null },
      },
      orderBy: { submitted_at: 'asc' },
    });
  }

  /**
   * Get all transactions with pagination
   */
  async getAll(page: number = 1, limit: number = 100): Promise<GameTransaction[]> {
    return await prisma.gameTransaction.findMany({
      orderBy: { submitted_at: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        player: true,
        session: true,
      },
    });
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    const [total, pending, confirmed, failed, retrying] = await Promise.all([
      prisma.gameTransaction.count(),
      prisma.gameTransaction.count({ where: { status: 'PENDING' } }),
      prisma.gameTransaction.count({ where: { status: 'CONFIRMED' } }),
      prisma.gameTransaction.count({ where: { status: 'FAILED' } }),
      prisma.gameTransaction.count({ where: { status: 'RETRYING' } }),
    ]);

    return {
      total,
      pending,
      confirmed,
      failed,
      retrying,
    };
  }
}

export const transactionService = new TransactionService();
