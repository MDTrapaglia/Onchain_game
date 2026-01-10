import type { Lucid, UTxO, Assets } from '@lucid-evolution/lucid';

// ============================================================================
// Player Stats (matches Aiken)
// ============================================================================

export interface PlayerStats {
  hp: bigint;
  exp: bigint;
  agility: bigint;
  strength: bigint;
  intelligence: bigint;
  speed: bigint;
}

// ============================================================================
// Player Datum (matches Aiken)
// ============================================================================

export interface PlayerDatum {
  stats: PlayerStats;
  signature: string;         // Hex string
  player_address: string;    // Hex string
  session_id: bigint;
}

// ============================================================================
// Game Parameters (matches Aiken)
// ============================================================================

export interface AssetClass {
  policy_id: string;
  name: string;
}

export interface GameParams {
  identity_nft: AssetClass;
  game_public_key: string;  // Hex string (32 bytes)
}

// ============================================================================
// Transaction Building
// ============================================================================

export interface BuildMintNFTParams {
  lucid: Lucid;
  utxo: UTxO;
  token_name: string;
}

export interface BuildMintNFTResult {
  policy_id: string;
  asset_name: string;
  tx_hash: string;
  assets: Assets;
}

export interface BuildCreatePlayerParams {
  lucid: Lucid;
  nft_policy_id: string;
  nft_asset_name: string;
  script_address: string;
  initial_stats: PlayerStats;
  player_address: string;
  signature: string;
}

export interface BuildStartSessionParams {
  lucid: Lucid;
  script_address: string;
  nft_policy_id: string;
  nft_asset_name: string;
  current_datum: PlayerDatum;
  new_signature: string;
}

export interface BuildUpdateStatsParams {
  lucid: Lucid;
  script_address: string;
  script_utxo: UTxO;
  current_datum: PlayerDatum;
  new_stats: PlayerStats;
}

export interface BuildFinalizeParams {
  lucid: Lucid;
  script_address: string;
  script_utxo: UTxO;
  current_datum: PlayerDatum;
  final_stats: PlayerStats;
  final_signature: string;
  withdraw_to_wallet: boolean;  // true = withdraw, false = continue playing
}

// ============================================================================
// Redeemers (matches Aiken)
// ============================================================================

export type GameRedeemer =
  | { Play: Record<string, never> }
  | { Update: Record<string, never> }
  | { Finalize: Record<string, never> };

// ============================================================================
// Contract Info
// ============================================================================

export interface ContractInfo {
  game_validator_script: string;    // PlutusV3 script hex
  game_validator_address: string;
  nft_policy_script: string;        // PlutusV3 script hex
  nft_policy_id: string;
}
