import { Lucid, Blockfrost } from '@lucid-evolution/lucid';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Setup collateral UTxO for Plutus transactions
 * Creates a 5 ADA UTxO if none exists
 *
 * Usage:
 *   npm run setup:collateral
 */

async function main() {
  const network = process.env.CARDANO_NETWORK as 'Mainnet' | 'Preprod' | 'Preview';
  const blockfrostApiKey = process.env.BLOCKFROST_API_KEY;
  const seedPhrase = process.env.WALLET_SEED_PHRASE;

  if (!blockfrostApiKey || !seedPhrase) {
    throw new Error('BLOCKFROST_API_KEY and WALLET_SEED_PHRASE must be set in .env');
  }

  console.log(`🔧 Setting up collateral on ${network}\n`);

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
  const utxos = await lucid.wallet().getUtxos();

  // Check if collateral already exists
  const collateralUtxos = utxos.filter((utxo) => {
    return (
      utxo.assets.lovelace === 5_000_000n &&
      Object.keys(utxo.assets).length === 1
    );
  });

  if (collateralUtxos.length > 0) {
    console.log('✅ Collateral UTxO already exists');
    console.log(`   ${collateralUtxos[0].txHash}#${collateralUtxos[0].outputIndex}`);
    console.log(`   Amount: 5 ADA\n`);
    return;
  }

  console.log('⚠️  No collateral UTxO found. Creating one...\n');

  // Create collateral UTxO (5 ADA)
  const tx = await lucid
    .newTx()
    .pay.ToAddress(address, { lovelace: 5_000_000n })
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();

  console.log('✅ Collateral UTxO created');
  console.log(`   Transaction: ${txHash}`);
  console.log(`   Amount: 5 ADA`);
  console.log('\n⏳ Waiting for confirmation...\n');

  // Wait for confirmation
  await lucid.awaitTx(txHash);

  console.log('✅ Collateral confirmed and ready to use\n');
}

main().catch(console.error);
