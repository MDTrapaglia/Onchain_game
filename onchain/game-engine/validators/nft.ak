use aiken/collection/list
use cardano/assets.{PolicyId, quantity_of, tokens}
use cardano/transaction.{Mint, OutputReference, Transaction}

// ============================================================================
// Identity NFT Minting Policy
// ============================================================================

/// Minting policy for Identity NFT
/// Ensures one-time mint of exactly one NFT
/// Uses UTXO as unique identifier (one-shot minting)
validator identity_nft(utxo_ref: OutputReference) {
  mint(
    _redeemer: Data,
    _policy_id: PolicyId,
    tx: Transaction,
  ) {
    // Get the minting value
    expect Mint(mint_value) = tx.mint

    // Find the specific UTXO being consumed
    expect Some(_input) =
      tx.inputs
        |> transaction.find_input(utxo_ref)

    // Count total tokens being minted/burned
    let minted_tokens = tokens(mint_value)
    let token_count = list.length(minted_tokens)

    // Ensure exactly one token is minted
    expect token_count == 1

    // Get the first (and only) token
    expect [(token_name, amount)] = minted_tokens

    // Ensure exactly 1 token is minted (not 0, not >1)
    expect amount == 1

    // Token name must not be empty
    expect !builtin.null_list(token_name)

    True
  }

  else(_) {
    fail @"Only minting is supported"
  }
}

// ============================================================================
// Tests
// ============================================================================

// Note: Full testing requires transaction context
// These tests validate helper logic

test test_token_name_not_empty() {
  let name = #"706c6179657230303031"  // "player0001" in hex
  !builtin.null_list(name)
}

test test_empty_token_name() fail {
  let name = #""
  expect !builtin.null_list(name)
  True
}
