use aiken/builtin
use aiken/collection/list
use aiken/crypto.{VerificationKey, verify_ed25519_signature}
use cardano/assets.{AssetName, PolicyId, quantity_of}
use cardano/transaction.{
  DatumHash, InlineDatum, Input, NoDatum, Output, OutputReference, Transaction,
  find_input,
}

// ============================================================================
// Type Definitions
// ============================================================================

/// Uniquely identify the Identity NFT
pub type AssetClass {
  policy_id: PolicyId,
  name: AssetName,
}

/// Player stats - 6 core attributes
pub type PlayerStats {
  hp: Int,           // Hit Points
  exp: Int,          // Experience Points
  agility: Int,      // Agility
  strength: Int,     // Strength
  intelligence: Int, // Intelligence
  speed: Int,        // Speed
}

/// Player datum stored on-chain
/// Contains stats and Ed25519 signature for validation
pub type PlayerDatum {
  stats: PlayerStats,
  signature: ByteArray,      // Ed25519 signature (64 bytes)
  player_address: ByteArray, // Player's wallet address
  session_id: Int,           // Incrementing session counter
}

/// Game parameters (parameterized validator)
pub type GameParams {
  identity_nft: AssetClass,  // Policy ID + name of Identity NFT
  game_public_key: VerificationKey, // Server's Ed25519 public key
}

/// Game redeemers
pub type GameRedeemer {
  Play      // Start game session - validate initial signature
  Update    // Update stats during session - validate transition
  Finalize  // End session - validate final signature and allow withdrawal
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Convert Int to ByteArray (8 bytes big-endian signed)
/// Compatible with Python's struct.pack('>q', n)
fn int_to_bytes(n: Int) -> ByteArray {
  builtin.integer_to_bytearray(True, 8, n)
}

/// Build message from player stats for signing
/// Format: exp || hp || agility || intelligence || session_id || speed || strength
/// Fields are in alphabetical order for consistency
fn build_stats_message(datum: PlayerDatum) -> ByteArray {
  // Order: agility, exp, hp, intelligence, session_id, speed, strength (alphabetical)
  let msg = int_to_bytes(datum.stats.agility)
  let msg = builtin.append_bytearray(msg, int_to_bytes(datum.stats.exp))
  let msg = builtin.append_bytearray(msg, int_to_bytes(datum.stats.hp))
  let msg = builtin.append_bytearray(msg, int_to_bytes(datum.stats.intelligence))
  let msg = builtin.append_bytearray(msg, int_to_bytes(datum.session_id))
  let msg = builtin.append_bytearray(msg, int_to_bytes(datum.stats.speed))
  let msg = builtin.append_bytearray(msg, int_to_bytes(datum.stats.strength))

  // Append player address for uniqueness
  builtin.append_bytearray(msg, datum.player_address)
}

/// Validate player stats are within acceptable ranges
fn validate_stat_ranges(stats: PlayerStats) -> Bool {
  // HP: 1 to 10000
  expect stats.hp >= 1 && stats.hp <= 10000

  // EXP: 0 to 1000000
  expect stats.exp >= 0 && stats.exp <= 1000000

  // Agility: 1 to 1000
  expect stats.agility >= 1 && stats.agility <= 1000

  // Strength: 1 to 1000
  expect stats.strength >= 1 && stats.strength <= 1000

  // Intelligence: 1 to 1000
  expect stats.intelligence >= 1 && stats.intelligence <= 1000

  // Speed: 1 to 1000
  expect stats.speed >= 1 && stats.speed <= 1000

  True
}

/// Verify Ed25519 signature on stats
/// Signs the SHA-256 hash of the message (not the message directly)
fn verify_stats_signature(
  datum: PlayerDatum,
  game_public_key: VerificationKey,
) -> Bool {
  // 1. Build message from stats
  let message = build_stats_message(datum)

  // 2. Hash the message with SHA-256
  let message_hash = builtin.sha2_256(message)

  // 3. Verify Ed25519 signature
  // Signature must be 64 bytes
  expect builtin.length_of_bytearray(datum.signature) == 64

  verify_ed25519_signature(game_public_key, message_hash, datum.signature)
}

/// Validate stat transition from old to new stats
/// Ensures stat changes are legal (non-negative increments, bounded changes)
fn validate_stat_transition(old_stats: PlayerStats, new_stats: PlayerStats) -> Bool {
  // HP can increase or decrease (combat damage/healing)
  // But changes should be bounded
  let hp_delta = new_stats.hp - old_stats.hp
  expect hp_delta >= -1000 && hp_delta <= 1000

  // EXP can only increase (monotonic)
  expect new_stats.exp >= old_stats.exp
  let exp_gain = new_stats.exp - old_stats.exp
  expect exp_gain <= 10000  // Max 10k exp per update

  // Agility can increase up to 100 points per update
  let agility_delta = new_stats.agility - old_stats.agility
  expect agility_delta >= 0 && agility_delta <= 100

  // Strength can increase up to 100 points per update
  let strength_delta = new_stats.strength - old_stats.strength
  expect strength_delta >= 0 && strength_delta <= 100

  // Intelligence can increase up to 100 points per update
  let intelligence_delta = new_stats.intelligence - old_stats.intelligence
  expect intelligence_delta >= 0 && intelligence_delta <= 100

  // Speed can increase up to 100 points per update
  let speed_delta = new_stats.speed - old_stats.speed
  expect speed_delta >= 0 && speed_delta <= 100

  True
}

/// Validate session increment
fn validate_session_increment(old_session: Int, new_session: Int) -> Bool {
  // Session must increment by exactly 1
  new_session == old_session + 1
}

// ============================================================================
// Validator
// ============================================================================

/// Main game validator
/// Enforces stat immutability and signature verification
validator game(params: GameParams) {
  spend(
    datum_opt: Option<PlayerDatum>,
    redeemer: GameRedeemer,
    utxo_ref: OutputReference,
    tx: Transaction,
  ) {
    // Get input being spent
    expect Some(game_input) =
      tx.inputs
        |> find_input(utxo_ref)

    // Input must contain the Identity NFT
    expect
      1 == quantity_of(
        game_input.output.value,
        params.identity_nft.policy_id,
        params.identity_nft.name,
      )

    when redeemer is {
      // Play: Start game session
      // Validates initial stats signature
      Play -> {
        // Find output going back to script (continuing UTxO)
        expect [game_output] =
          list.filter(
            tx.outputs,
            fn(o) { o.address == game_input.output.address },
          )

        // Output must contain the Identity NFT
        expect
          1 == quantity_of(
            game_output.value,
            params.identity_nft.policy_id,
            params.identity_nft.name,
          )

        // Get and validate output datum
        expect InlineDatum(output_datum) = game_output.datum
        expect player_datum: PlayerDatum = output_datum

        // Validate stat ranges
        expect validate_stat_ranges(player_datum.stats)

        // Validate signature from game server
        expect verify_stats_signature(player_datum, params.game_public_key)

        True
      }

      // Update: Transition states during gameplay
      // Validates stat changes are legal (linaje)
      Update -> {
        // Get input datum
        expect Some(input_datum_opt) = datum_opt
        expect input_datum: PlayerDatum = input_datum_opt

        // Find output going back to script
        expect [game_output] =
          list.filter(
            tx.outputs,
            fn(o) { o.address == game_input.output.address },
          )

        // Output must contain the Identity NFT
        expect
          1 == quantity_of(
            game_output.value,
            params.identity_nft.policy_id,
            params.identity_nft.name,
          )

        // Get output datum
        expect InlineDatum(output_datum) = game_output.datum
        expect new_datum: PlayerDatum = output_datum

        // Validate stat ranges on new stats
        expect validate_stat_ranges(new_datum.stats)

        // Validate stat transition (linaje)
        expect validate_stat_transition(input_datum.stats, new_datum.stats)

        // Session ID must remain the same during updates
        expect input_datum.session_id == new_datum.session_id

        // Player address must remain the same
        expect input_datum.player_address == new_datum.player_address

        True
      }

      // Finalize: End session and allow withdrawal
      // Validates final signature and increments session
      Finalize -> {
        // Get input datum
        expect Some(input_datum_opt) = datum_opt
        expect input_datum: PlayerDatum = input_datum_opt

        // Two options:
        // 1. Output to player wallet (withdrawal)
        // 2. Output back to script with incremented session (continue playing)

        // Find any output containing the Identity NFT
        expect [nft_output] =
          list.filter(
            tx.outputs,
            fn(o) {
              quantity_of(
                o.value,
                params.identity_nft.policy_id,
                params.identity_nft.name,
              ) == 1
            },
          )

        // If going back to script, validate session increment and signature
        when nft_output.datum is {
          InlineDatum(d) -> {
            // Output has datum - must be going back to script
            expect new_datum: PlayerDatum = d

            // Validate stat ranges
            expect validate_stat_ranges(new_datum.stats)

            // Validate session increment
            expect validate_session_increment(
              input_datum.session_id,
              new_datum.session_id,
            )

            // Validate signature on new stats
            expect verify_stats_signature(new_datum, params.game_public_key)

            // Player address must remain the same
            expect input_datum.player_address == new_datum.player_address

            True
          }

          // No datum - withdrawal to player wallet allowed
          NoDatum -> True

          // Datum hash not allowed
          DatumHash(_) -> fail @"Datum must be inline or absent"
        }
      }
    }
  }

  else(_) {
    fail @"Unsupported action"
  }
}

// ============================================================================
// Tests
// ============================================================================

test test_int_to_bytes() {
  let bytes = int_to_bytes(1000)
  builtin.length_of_bytearray(bytes) == 8
}

test test_validate_stat_ranges_valid() {
  let stats =
    PlayerStats {
      hp: 100,
      exp: 0,
      agility: 10,
      strength: 10,
      intelligence: 10,
      speed: 10,
    }

  validate_stat_ranges(stats)
}

test test_validate_stat_ranges_invalid_hp() fail {
  let stats =
    PlayerStats {
      hp: 0,  // Invalid: must be >= 1
      exp: 0,
      agility: 10,
      strength: 10,
      intelligence: 10,
      speed: 10,
    }

  validate_stat_ranges(stats)
}

test test_validate_stat_transition_valid() {
  let old_stats =
    PlayerStats {
      hp: 100,
      exp: 0,
      agility: 10,
      strength: 10,
      intelligence: 10,
      speed: 10,
    }

  let new_stats =
    PlayerStats {
      hp: 90,   // Lost 10 HP in combat
      exp: 100, // Gained 100 EXP
      agility: 15,      // Gained 5 agility
      strength: 12,     // Gained 2 strength
      intelligence: 10, // No change
      speed: 11,        // Gained 1 speed
    }

  validate_stat_transition(old_stats, new_stats)
}

test test_validate_stat_transition_exp_decrease() fail {
  let old_stats =
    PlayerStats {
      hp: 100,
      exp: 100,
      agility: 10,
      strength: 10,
      intelligence: 10,
      speed: 10,
    }

  let new_stats =
    PlayerStats {
      hp: 100,
      exp: 50,  // Invalid: EXP cannot decrease
      agility: 10,
      strength: 10,
      intelligence: 10,
      speed: 10,
    }

  validate_stat_transition(old_stats, new_stats)
}

test test_validate_session_increment() {
  validate_session_increment(0, 1)
}

test test_validate_session_increment_invalid() fail {
  validate_session_increment(0, 2)  // Must increment by 1
}
