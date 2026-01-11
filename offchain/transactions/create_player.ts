import { Lucid, Blockfrost, Data } from '@lucid-evolution/lucid';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import axios from 'axios';
import { loadWallet } from './utils/wallet_helpers.js';

dotenv.config();

/**
 * Create player - lock Identity NFT in game script
 * This is the first time locking the NFT with initial stats
 *
 * Prerequisites:
 * 1. Identity NFT minted
 * 2. Player registered via API
 *
 * Usage:
 *   npm run game:create-player
 */

async function main() {
  const network = process.env.CARDANO_NETWORK as 'Mainnet' | 'Preprod' | 'Preview';
  const blockfrostApiKey = process.env.BLOCKFROST_API_KEY;
  const seedPhrase = process.env.WALLET_SEED_PHRASE;
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  const apiUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const apiToken = process.env.ACCESS_TOKEN;

  if (!blockfrostApiKey || !apiToken) {
    throw new Error('Required env vars: BLOCKFROST_API_KEY, ACCESS_TOKEN');
  }

  if (!seedPhrase && !privateKey) {
    throw new Error('Either WALLET_SEED_PHRASE or WALLET_PRIVATE_KEY must be set in .env');
  }

  console.log(`🎮 Creating player on ${network}\n`);

  // Initialize Lucid
  const lucid = await Lucid(
    new Blockfrost(
      `https://cardano-${network.toLowerCase()}.blockfrost.io/api/v0`,
      blockfrostApiKey
    ),
    network
  );

  loadWallet(lucid, seedPhrase, privateKey);
  const address = await lucid.wallet().address();

  console.log(`Player wallet: ${address}\n`);

  // Get player info from API
  console.log('📡 Fetching player info from API...');
  const playerResponse = await axios.get(
    `${apiUrl}/api/players/${address}?token=${apiToken}`
  );

  const player = playerResponse.data.player;

  console.log(`✅ Player found:`);
  console.log(`   NFT Policy: ${player.nft_policy_id}`);
  console.log(`   NFT Name: ${player.nft_asset_name}`);
  console.log(`   Current HP: ${player.current_hp}`);
  console.log(`   Current EXP: ${player.current_exp}\n`);

  // Prepare initial stats for signing
  const initialStats = {
    hp: player.current_hp,
    exp: player.current_exp,
    agility: player.current_agility,
    strength: player.current_strength,
    intelligence: player.current_intelligence,
    speed: player.current_speed,
  };

  // Get signature from API
  console.log('✍️  Requesting signature from game server...');
  const signResponse = await axios.post(
    `${apiUrl}/api/sign?token=${apiToken}`,
    {
      stats: initialStats,
      player_address: address,
      session_id: 0,
    }
  );

  const { signature, hash, publicKey } = signResponse.data;

  console.log(`✅ Signature received:`);
  console.log(`   Hash: ${hash.substring(0, 32)}...`);
  console.log(`   Signature: ${signature.substring(0, 32)}...\n`);

  console.log('⚠️  Transaction builder pending plutus.json integration');
  console.log('   After compiling contracts:');
  console.log('   1. Load game validator from plutus.json');
  console.log('   2. Get script address');
  console.log('   3. Build transaction to lock NFT with datum');
  console.log('   4. Datum includes: stats, signature, player_address, session_id=0\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Ready for transaction building once plutus.json is available');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
