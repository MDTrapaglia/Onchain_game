import { buildStatsMessage, calculateHash } from '../utils/message-builder.js';
import { signEd25519 } from '../utils/signature-verification.js';
import type { SigningData, SignatureResult } from '../types/index.js';

class SigningService {
  private privateKey: string | null = null;
  private publicKey: string | null = null;

  constructor() {
    // Load keys from environment
    const privKey = process.env.GAME_PRIVATE_KEY;
    const pubKey = process.env.GAME_PUBLIC_KEY;

    if (privKey && pubKey) {
      this.privateKey = privKey;
      this.publicKey = pubKey;
      console.log('✅ Signing service initialized with Ed25519 keys');
    } else {
      console.warn('⚠️  Signing service: GAME_PRIVATE_KEY or GAME_PUBLIC_KEY not configured');
    }
  }

  /**
   * Check if signing service is available
   */
  isAvailable(): boolean {
    return this.privateKey !== null && this.publicKey !== null;
  }

  /**
   * Get public key
   */
  getPublicKey(): string | null {
    return this.publicKey;
  }

  /**
   * Sign player stats
   * @param data - Signing data with stats, player address, and session ID
   * @returns Signature result with signature, hash, message, and public key
   */
  async signStats(data: SigningData): Promise<SignatureResult> {
    if (!this.isAvailable()) {
      throw new Error('Signing service not available. Configure GAME_PRIVATE_KEY and GAME_PUBLIC_KEY.');
    }

    // Build message from stats
    const message = buildStatsMessage(data);
    const messageHex = message.toString('hex');

    // Calculate SHA-256 hash
    const hash = calculateHash(message);
    const hashBuffer = Buffer.from(hash, 'hex');

    // Sign the hash with Ed25519
    const signature = signEd25519(hashBuffer, this.privateKey!);

    console.log(`📝 Signed stats for player ${data.player_address.substring(0, 16)}...`);
    console.log(`   Session: ${data.session_id}`);
    console.log(`   Stats: HP=${data.stats.hp} EXP=${data.stats.exp} AGI=${data.stats.agility} STR=${data.stats.strength} INT=${data.stats.intelligence} SPD=${data.stats.speed}`);
    console.log(`   Hash: ${hash.substring(0, 16)}...`);
    console.log(`   Signature: ${signature.substring(0, 16)}...`);

    return {
      signature,
      hash,
      message: messageHex,
      publicKey: this.publicKey!,
    };
  }

  /**
   * Sign a hash directly
   * @param hash - SHA-256 hash (hex string, 64 chars)
   */
  async signHash(hash: string): Promise<SignatureResult> {
    if (!this.isAvailable()) {
      throw new Error('Signing service not available.');
    }

    const hashBuffer = Buffer.from(hash, 'hex');

    if (hashBuffer.length !== 32) {
      throw new Error('Invalid hash length. Expected 32 bytes (64 hex chars).');
    }

    const signature = signEd25519(hashBuffer, this.privateKey!);

    return {
      signature,
      hash,
      message: '',
      publicKey: this.publicKey!,
    };
  }
}

// Export singleton instance
export const signingService = new SigningService();
