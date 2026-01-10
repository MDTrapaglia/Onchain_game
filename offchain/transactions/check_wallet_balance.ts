import { Lucid, Blockfrost } from '@lucid-evolution/lucid';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Check wallet balance
 *
 * Usage:
 *   npm run wallet:balance
 */

async function main() {
  const network = process.env.CARDANO_NETWORK as 'Mainnet' | 'Preprod' | 'Preview';
  const blockfrostApiKey = process.env.BLOCKFROST_API_KEY;
  const seedPhrase = process.env.WALLET_SEED_PHRASE;

  if (!blockfrostApiKey) {
    throw new Error('BLOCKFROST_API_KEY not set in .env');
  }

  if (!seedPhrase) {
    throw new Error('WALLET_SEED_PHRASE not set in .env');
  }

  console.log(`🔍 Checking wallet balance on ${network}\n`);

  // Initialize Lucid
  const lucid = await Lucid(
    new Blockfrost(
      `https://cardano-${network.toLowerCase()}.blockfrost.io/api/v0`,
      blockfrostApiKey
    ),
    network
  );

  // Select wallet
  lucid.selectWallet.fromSeed(seedPhrase);

  const address = await lucid.wallet().address();
  const utxos = await lucid.wallet().getUtxos();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Wallet Information');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Address: ${address}`);
  console.log(`Network: ${network}`);
  console.log(`\nUTxOs: ${utxos.length}`);

  // Calculate total ADA
  let totalLovelace = 0n;
  const assets: Record<string, bigint> = {};

  for (const utxo of utxos) {
    totalLovelace += utxo.assets.lovelace || 0n;

    for (const [assetId, amount] of Object.entries(utxo.assets)) {
      if (assetId === 'lovelace') continue;
      assets[assetId] = (assets[assetId] || 0n) + amount;
    }
  }

  console.log(`\nTotal ADA: ${Number(totalLovelace) / 1_000_000} ADA`);

  if (Object.keys(assets).length > 0) {
    console.log('\nNative Assets:');
    for (const [assetId, amount] of Object.entries(assets)) {
      console.log(`  ${assetId}: ${amount}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error);
