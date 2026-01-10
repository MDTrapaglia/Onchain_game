import {
  Lucid,
  Data,
  UTxO,
  paymentCredentialOf,
  getAddressDetails,
} from '@lucid-evolution/lucid';
import type {
  PlayerStats,
  PlayerDatum,
  GameRedeemer,
  BuildMintNFTParams,
  BuildMintNFTResult,
  BuildCreatePlayerParams,
  BuildStartSessionParams,
  BuildUpdateStatsParams,
  BuildFinalizeParams,
} from './types.js';

// ============================================================================
// Data Schemas (CBOR encoding for Plutus V3)
// ============================================================================

const PlayerStatsSchema = Data.Object({
  hp: Data.Integer(),
  exp: Data.Integer(),
  agility: Data.Integer(),
  strength: Data.Integer(),
  intelligence: Data.Integer(),
  speed: Data.Integer(),
});

const PlayerDatumSchema = Data.Object({
  stats: PlayerStatsSchema,
  signature: Data.Bytes(),
  player_address: Data.Bytes(),
  session_id: Data.Integer(),
});

const GameRedeemerSchema = Data.Enum([
  Data.Literal('Play'),
  Data.Literal('Update'),
  Data.Literal('Finalize'),
]);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert PlayerStats to Plutus Data
 */
export function statsToPlutusData(stats: PlayerStats) {
  return Data.to(stats, PlayerStatsSchema);
}

/**
 * Convert PlayerDatum to Plutus Data
 */
export function datumToPlutusData(datum: PlayerDatum) {
  // Convert hex strings to bytes
  const datumWithBytes = {
    ...datum,
    signature: datum.signature,
    player_address: datum.player_address,
  };

  return Data.to(datumWithBytes, PlayerDatumSchema);
}

/**
 * Convert GameRedeemer to Plutus Data
 */
export function redeemerToPlutusData(redeemer: GameRedeemer) {
  return Data.to(redeemer, GameRedeemerSchema);
}

/**
 * Parse PlayerDatum from Plutus Data
 */
export function parseDatum(datumCbor: string): PlayerDatum {
  const datum = Data.from(datumCbor, PlayerDatumSchema);
  return datum as PlayerDatum;
}

/**
 * Find UTxO by policy and asset name
 */
export async function findUTxOByNFT(
  lucid: Lucid,
  address: string,
  policy_id: string,
  asset_name: string
): Promise<UTxO | undefined> {
  const utxos = await lucid.utxosAt(address);
  const assetId = policy_id + asset_name;

  return utxos.find((utxo) => {
    return utxo.assets[assetId] === 1n;
  });
}

// ============================================================================
// Transaction Builders
// ============================================================================

/**
 * Mint Identity NFT
 * Uses one-shot minting policy
 */
export async function buildMintNFT(
  params: BuildMintNFTParams
): Promise<BuildMintNFTResult> {
  const { lucid, utxo, token_name } = params;

  // Load NFT minting policy script
  // NOTE: This should be loaded from plutus.json
  // For now, placeholder
  const nftPolicyScript = ''; // TODO: Load from build artifacts

  // Build transaction
  const tx = await lucid
    .newTx()
    .collectFrom([utxo])
    .mintAssets(
      {
        [token_name]: 1n,
      },
      Data.void() // Redeemer (empty)
    )
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();

  // Calculate policy ID and asset name
  const policyId = lucid.utils.mintingPolicyToId(nftPolicyScript);
  const assetName = token_name;

  return {
    policy_id: policyId,
    asset_name: assetName,
    tx_hash: txHash,
    assets: {
      [policyId + assetName]: 1n,
    },
  };
}

/**
 * Create player (lock NFT in script)
 * This is the first time locking the NFT
 */
export async function buildCreatePlayer(
  params: BuildCreatePlayerParams
): Promise<string> {
  const {
    lucid,
    nft_policy_id,
    nft_asset_name,
    script_address,
    initial_stats,
    player_address,
    signature,
  } = params;

  // Create datum
  const datum: PlayerDatum = {
    stats: initial_stats,
    signature,
    player_address,
    session_id: 0n,
  };

  const datumCbor = datumToPlutusData(datum);

  // Build transaction
  const assetId = nft_policy_id + nft_asset_name;

  const tx = await lucid
    .newTx()
    .pay.ToContract(
      script_address,
      { kind: 'inline', value: datumCbor },
      { [assetId]: 1n }
    )
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();

  return txHash;
}

/**
 * Start game session (Play redeemer)
 * Validates signature and allows spending
 */
export async function buildStartSession(
  params: BuildStartSessionParams
): Promise<string> {
  const {
    lucid,
    script_address,
    nft_policy_id,
    nft_asset_name,
    current_datum,
    new_signature,
  } = params;

  // Find script UTxO with NFT
  const scriptUtxo = await findUTxOByNFT(
    lucid,
    script_address,
    nft_policy_id,
    nft_asset_name
  );

  if (!scriptUtxo) {
    throw new Error('Script UTxO with NFT not found');
  }

  // Create new datum with updated signature
  const newDatum: PlayerDatum = {
    ...current_datum,
    signature: new_signature,
  };

  const datumCbor = datumToPlutusData(newDatum);
  const redeemer: GameRedeemer = { Play: {} };
  const redeemerCbor = redeemerToPlutusData(redeemer);

  // Build transaction
  const assetId = nft_policy_id + nft_asset_name;

  const tx = await lucid
    .newTx()
    .collectFrom([scriptUtxo], redeemerCbor)
    .pay.ToContract(
      script_address,
      { kind: 'inline', value: datumCbor },
      { [assetId]: 1n }
    )
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();

  return txHash;
}

/**
 * Update player stats (Update redeemer)
 * Validates stat transition
 */
export async function buildUpdateStats(
  params: BuildUpdateStatsParams
): Promise<string> {
  const { lucid, script_address, script_utxo, current_datum, new_stats } =
    params;

  // Create new datum with updated stats
  // Session ID remains the same during updates
  const newDatum: PlayerDatum = {
    ...current_datum,
    stats: new_stats,
  };

  const datumCbor = datumToPlutusData(newDatum);
  const redeemer: GameRedeemer = { Update: {} };
  const redeemerCbor = redeemerToPlutusData(redeemer);

  // Build transaction
  const tx = await lucid
    .newTx()
    .collectFrom([script_utxo], redeemerCbor)
    .pay.ToContract(
      script_address,
      { kind: 'inline', value: datumCbor },
      script_utxo.assets
    )
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();

  return txHash;
}

/**
 * Finalize session (Finalize redeemer)
 * Validates final signature and increments session
 */
export async function buildFinalize(
  params: BuildFinalizeParams
): Promise<string> {
  const {
    lucid,
    script_address,
    script_utxo,
    current_datum,
    final_stats,
    final_signature,
    withdraw_to_wallet,
  } = params;

  const redeemer: GameRedeemer = { Finalize: {} };
  const redeemerCbor = redeemerToPlutusData(redeemer);

  let tx = lucid.newTx().collectFrom([script_utxo], redeemerCbor);

  if (withdraw_to_wallet) {
    // Withdraw NFT to player wallet
    // No datum needed
    const walletAddress = await lucid.wallet().address();
    tx = tx.pay.ToAddress(walletAddress, script_utxo.assets);
  } else {
    // Continue playing - send back to script with incremented session
    const newDatum: PlayerDatum = {
      stats: final_stats,
      signature: final_signature,
      player_address: current_datum.player_address,
      session_id: current_datum.session_id + 1n,
    };

    const datumCbor = datumToPlutusData(newDatum);

    tx = tx.pay.ToContract(
      script_address,
      { kind: 'inline', value: datumCbor },
      script_utxo.assets
    );
  }

  const completeTx = await tx.complete();
  const signedTx = await completeTx.sign().complete();
  const txHash = await signedTx.submit();

  return txHash;
}

/**
 * Get script addresses from validator scripts
 */
export function getScriptAddress(
  lucid: Lucid,
  validatorScript: string
): string {
  const validator = {
    type: 'PlutusV3' as const,
    script: validatorScript,
  };

  return lucid.utils.validatorToAddress(validator);
}

/**
 * Load contract info from plutus.json
 */
export async function loadContractInfo(
  plutusJsonPath: string
): Promise<{ game_script: string; nft_script: string }> {
  // TODO: Implement loading from plutus.json
  // This should read the compiled Aiken validators
  throw new Error('Not implemented');
}
