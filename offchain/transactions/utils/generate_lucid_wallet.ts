import { generateMnemonic } from '@lucid-evolution/lucid';
import { generateEd25519Keypair } from '../../backend/utils/signature-verification.js';

/**
 * Generate new wallet and Ed25519 keypair for development
 *
 * Usage:
 *   npm run lucid:generate-wallet
 */

console.log('🔑 Generating new Cardano wallet and Ed25519 keypair\n');

// Generate Cardano wallet (24 words)
const mnemonic = generateMnemonic();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Cardano Wallet (for operator transactions)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Seed phrase (24 words):');
console.log(mnemonic);
console.log('\n⚠️  Save this seed phrase securely!');
console.log('Add to .env as:');
console.log(`WALLET_SEED_PHRASE="${mnemonic}"\n`);

// Generate Ed25519 keypair (for signing stats)
const ed25519 = generateEd25519Keypair();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Ed25519 Keypair (for signing player stats)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Public key (32 bytes):');
console.log(ed25519.publicKey);
console.log('\nPrivate key (64 bytes):');
console.log(ed25519.secretKey);
console.log('\n⚠️  Keep the private key secret!');
console.log('Add to .env as:');
console.log(`GAME_PUBLIC_KEY="${ed25519.publicKey}"`);
console.log(`GAME_PRIVATE_KEY="${ed25519.secretKey}"\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Keys generated successfully');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
