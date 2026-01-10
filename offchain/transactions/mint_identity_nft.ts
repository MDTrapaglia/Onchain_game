import { Lucid, Blockfrost, fromText } from '@lucid-evolution/lucid';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

dotenv.config();

/**
 * Mint Identity NFT for a new player
 * Uses one-shot minting policy from nft.ak
 *
 * Usage:
 *   npm run game:mint-nft
 */

async function main() {
  const network = process.env.CARDANO_NETWORK as 'Mainnet' | 'Preprod' | 'Preview';
  const blockfrostApiKey = process.env.BLOCKFROST_API_KEY;
  const seedPhrase = process.env.WALLET_SEED_PHRASE;

  if (!blockfrostApiKey || !seedPhrase) {
    throw new Error('BLOCKFROST_API_KEY and WALLET_SEED_PHRASE must be set in .env');
  }

  console.log(`🎮 Minting Identity NFT on ${network}\n`);

  // Initialize Lucid
  const lucid = await Lucid(
    new Blockfrost(
      `https://cardano-${network.toLowerCase()}.blockfrost.io/api/v0`,
      blockfrostApiKey
    ),
    network
  );

  lucid.selectWallet.fromSeed(seedPhrase);

  const address = await lucid.wallet().address();

  console.log(`Minting for wallet: ${address}\n`);

  // Load NFT minting policy
  const plutusJsonPath = resolve(
    __dirname,
    '../../onchain/game-engine/plutus.json'
  );

  let plutusJson: any;
  try {
    plutusJson = JSON.parse(readFileSync(plutusJsonPath, 'utf-8'));
  } catch (error) {
    console.error('❌ Failed to load plutus.json');
    console.error('   Make sure to compile Aiken contracts first:');
    console.error('   cd onchain/game-engine && aiken build\n');
    throw error;
  }

  // Find NFT minting policy validator
  const nftValidator = plutusJson.validators.find(
    (v: any) => v.title === 'identity_nft.identity_nft'
  );

  if (!nftValidator) {
    throw new Error('NFT minting policy not found in plutus.json');
  }

  // Get UTxOs to use as seed for one-shot minting
  const utxos = await lucid.wallet().getUtxos();

  if (utxos.length === 0) {
    throw new Error('No UTxOs available. Fund your wallet first.');
  }

  // Use first UTxO as seed
  const seedUtxo = utxos[0];

  console.log('📦 Using UTxO as seed:');
  console.log(`   ${seedUtxo.txHash}#${seedUtxo.outputIndex}\n`);

  // Generate unique token name from wallet address (first 32 chars)
  const tokenName = fromText(`player_${address.substring(0, 16)}`);

  console.log(`🎫 Token name: player_${address.substring(0, 16)}\n`);

  // Build minting transaction
  // NOTE: This is a simplified version. The actual implementation
  // needs the compiled script from plutus.json
  console.log('⚠️  NFT minting transaction builder pending plutus.json integration');
  console.log('   After compiling contracts, the policy ID will be:');
  console.log(`   ${nftValidator.hash}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Next steps:');
  console.log('1. Compile Aiken contracts: cd onchain/game-engine && aiken build');
  console.log('2. Re-run this script to mint Identity NFT');
  console.log('3. Register player with API: POST /api/players/register');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
