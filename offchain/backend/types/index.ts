// ============================================================================
// Player Stats
// ============================================================================

export interface PlayerStats {
  hp: number;
  exp: number;
  agility: number;
  strength: number;
  intelligence: number;
  speed: number;
}

// ============================================================================
// API Payloads
// ============================================================================

export interface StartSessionPayload {
  wallet_address: string;
  nft_policy_id: string;
  nft_asset_name: string;
}

export interface UpdateStatsPayload {
  session_id: string;
  stats: PlayerStats;
}

export interface FinalizeSessionPayload {
  session_id: string;
  final_stats: PlayerStats;
}

// ============================================================================
// Signing
// ============================================================================

export interface SigningData {
  stats: PlayerStats;
  player_address: string;
  session_id: number;
}

export interface SignatureResult {
  signature: string;      // Hex encoded (128 chars)
  hash: string;          // Hex encoded (64 chars)
  message: string;       // Hex encoded message
  publicKey: string;     // Hex encoded (64 chars)
}

// ============================================================================
// Game Transaction Building
// ============================================================================

export interface GameDatum {
  stats: PlayerStats;
  signature: string;
  player_address: string;
  session_id: number;
}

export interface TransactionResult {
  tx_hash: string;
  tx_cbor?: string;
}
