import { createHash } from 'crypto';
import type { SigningData } from '../types/index.js';

/**
 * Convert integer to 8-byte big-endian signed representation
 * Compatible with Aiken's builtin.integer_to_bytearray(True, 8, n)
 */
function intToBytes(n: number): Buffer {
  const buffer = Buffer.allocUnsafe(8);
  // Write as big-endian signed 64-bit integer
  buffer.writeBigInt64BE(BigInt(n));
  return buffer;
}

/**
 * Build message from signing data for Ed25519 signature
 * Field order MUST match Aiken validator: alphabetical
 * agility || exp || hp || intelligence || session_id || speed || strength || player_address
 */
export function buildStatsMessage(data: SigningData): Buffer {
  const parts: Buffer[] = [];

  // Alphabetical order to match Aiken
  parts.push(intToBytes(data.stats.agility));
  parts.push(intToBytes(data.stats.exp));
  parts.push(intToBytes(data.stats.hp));
  parts.push(intToBytes(data.stats.intelligence));
  parts.push(intToBytes(data.session_id));
  parts.push(intToBytes(data.stats.speed));
  parts.push(intToBytes(data.stats.strength));

  // Append player address (as hex bytes)
  parts.push(Buffer.from(data.player_address, 'hex'));

  return Buffer.concat(parts);
}

/**
 * Calculate SHA-256 hash of message
 */
export function calculateHash(message: Buffer): string {
  const hash = createHash('sha256');
  hash.update(message);
  return hash.digest('hex');
}

/**
 * Verify that provided hash matches message
 */
export function verifyHash(message: Buffer, providedHash: string): boolean {
  const calculatedHash = calculateHash(message);
  return calculatedHash === providedHash.toLowerCase();
}
