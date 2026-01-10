import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { prisma } from './config/prisma.js';
import { playerService } from './services/player.service.js';
import { sessionService } from './services/session.service.js';
import { transactionService } from './services/transaction.service.js';
import { signingService } from './services/signing.service.js';
import type {
  StartSessionPayload,
  FinalizeSessionPayload,
  PlayerStats,
} from './types/index.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'default_dev_token_change_me';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Not Found' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin (Postman, curl, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        FRONTEND_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // In development, allow all origins
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(limiter);

// Authentication middleware
function validateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.query.token || req.headers['x-access-token'];

  if (token !== ACCESS_TOKEN) {
    return res.status(404).json({ error: 'Not Found' });
  }

  next();
}

// ============================================================================
// API Routes
// ============================================================================

/**
 * POST /api/players/register
 * Register a new player with Identity NFT
 */
app.post('/api/players/register', validateToken, async (req: Request, res: Response) => {
  try {
    const { wallet_address, nft_policy_id, nft_asset_name, nft_tx_hash, stake_address, script_address } = req.body;

    if (!wallet_address || !nft_policy_id || !nft_asset_name) {
      return res.status(400).json({
        error: 'Missing required fields: wallet_address, nft_policy_id, nft_asset_name',
      });
    }

    // Check if player already exists
    const existing = await playerService.getByWallet(wallet_address);
    if (existing) {
      return res.status(409).json({
        error: 'Player already registered',
        player: existing,
      });
    }

    // Create player
    const player = await playerService.create({
      wallet_address,
      nft_policy_id,
      nft_asset_name,
      nft_tx_hash,
      stake_address,
      script_address,
    });

    console.log(`✅ New player registered: ${wallet_address.substring(0, 16)}...`);

    res.status(201).json({
      status: 'success',
      player,
    });
  } catch (error: any) {
    console.error('Error registering player:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/players/:wallet_address
 * Get player info by wallet address
 */
app.get('/api/players/:wallet_address', validateToken, async (req: Request, res: Response) => {
  try {
    const { wallet_address } = req.params;

    const player = await playerService.getByWallet(wallet_address);

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({ player });
  } catch (error: any) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sessions/start
 * Start a new game session
 */
app.post('/api/sessions/start', validateToken, async (req: Request, res: Response) => {
  try {
    const payload: StartSessionPayload = req.body;

    // Get player
    const player = await playerService.getByNFT(
      payload.nft_policy_id,
      payload.nft_asset_name
    );

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if already playing
    if (player.is_playing) {
      const activeSession = await sessionService.getActiveSession(player.id);
      return res.status(409).json({
        error: 'Player already in active session',
        session: activeSession,
      });
    }

    // Create session
    const session = await sessionService.create({
      player_id: player.id,
      session_number: player.current_session_id,
      start_stats: {
        hp: player.current_hp,
        exp: player.current_exp,
        agility: player.current_agility,
        strength: player.current_strength,
        intelligence: player.current_intelligence,
        speed: player.current_speed,
      },
    });

    // Mark player as playing
    await playerService.setPlaying(player.id, true);

    console.log(`🎮 Session started for player ${player.wallet_address.substring(0, 16)}...`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Session Number: ${session.session_number}`);

    res.status(201).json({
      status: 'success',
      session,
    });
  } catch (error: any) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sessions/:session_id/finalize
 * Finalize game session and sign final stats
 */
app.post(
  '/api/sessions/:session_id/finalize',
  validateToken,
  async (req: Request, res: Response) => {
    try {
      const { session_id } = req.params;
      const payload: FinalizeSessionPayload = req.body;

      // Get session
      const session = await sessionService.getById(session_id);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Session is not active' });
      }

      // Validate final stats
      const finalStats = payload.final_stats;

      // Sign the final stats
      const signatureResult = await signingService.signStats({
        stats: finalStats,
        player_address: session.player.wallet_address,
        session_id: session.session_number + 1, // Next session ID
      });

      // Update session
      const updatedSession = await sessionService.finalize(session_id, {
        final_stats: finalStats,
        signature: signatureResult.signature,
        message: signatureResult.message,
      });

      // Update player stats
      await playerService.updateStats(session.player.id, {
        current_hp: finalStats.hp,
        current_exp: finalStats.exp,
        current_agility: finalStats.agility,
        current_strength: finalStats.strength,
        current_intelligence: finalStats.intelligence,
        current_speed: finalStats.speed,
      });

      console.log(`🏁 Session finalized: ${session_id}`);
      console.log(`   Player: ${session.player.wallet_address.substring(0, 16)}...`);
      console.log(`   Final stats: HP=${finalStats.hp} EXP=${finalStats.exp} AGI=${finalStats.agility} STR=${finalStats.strength} INT=${finalStats.intelligence} SPD=${finalStats.speed}`);

      res.json({
        status: 'success',
        session: updatedSession,
        signature: signatureResult,
      });
    } catch (error: any) {
      console.error('Error finalizing session:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/sessions/:session_id
 * Get session details
 */
app.get('/api/sessions/:session_id', validateToken, async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;

    const session = await sessionService.getById(session_id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sessions/player/:player_id
 * Get sessions for a player
 */
app.get('/api/sessions/player/:player_id', validateToken, async (req: Request, res: Response) => {
  try {
    const { player_id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const sessions = await sessionService.getByPlayer(player_id, limit);

    res.json({ sessions });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/transactions
 * Get all transactions with pagination
 */
app.get('/api/transactions', validateToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

    const transactions = await transactionService.getAll(page, limit);

    res.json({ transactions });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/statistics
 * Get aggregated statistics
 */
app.get('/api/statistics', validateToken, async (req: Request, res: Response) => {
  try {
    const [playerCount, sessionStats, txStats] = await Promise.all([
      prisma.player.count({ where: { is_active: true } }),
      sessionService.getStatistics(),
      transactionService.getStatistics(),
    ]);

    res.json({
      players: {
        total: playerCount,
      },
      sessions: sessionStats,
      transactions: txStats,
    });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sign
 * Sign stats with server Ed25519 key
 */
app.post('/api/sign', validateToken, async (req: Request, res: Response) => {
  try {
    if (!signingService.isAvailable()) {
      return res.status(503).json({
        error: 'Signing service not available. GAME_PRIVATE_KEY not configured.',
      });
    }

    const { stats, player_address, session_id } = req.body;

    if (!stats || !player_address || session_id === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: stats, player_address, session_id',
      });
    }

    const result = await signingService.signStats({
      stats,
      player_address,
      session_id,
    });

    res.json({
      status: 'success',
      ...result,
    });
  } catch (error: any) {
    console.error('Error signing:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Server Startup
// ============================================================================

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🌐 Game API server running on http://0.0.0.0:${PORT}`);
  console.log(`🎮 On-chain game engine ready`);

  // Test database connection
  try {
    await prisma.$connect();
    console.log(`✅ Database connected`);
  } catch (error) {
    console.error(`❌ Database connection failed:`, error);
    console.error(`💡 Make sure PostgreSQL is running: docker-compose up -d`);
    process.exit(1);
  }

  // Check signing service
  if (signingService.isAvailable()) {
    console.log(`✅ Ed25519 signing service available`);
    console.log(`   Public key: ${signingService.getPublicKey()?.substring(0, 16)}...`);
  } else {
    console.warn(`⚠️  Ed25519 signing service not configured`);
    console.warn(`   Set GAME_PRIVATE_KEY and GAME_PUBLIC_KEY in .env`);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
