import { C } from 'lucid-cardano';
import type { LucidEvolution } from '@lucid-evolution/lucid';

/**
 * Derive payment key from extended private key (xprv)
 * Uses BIP32 derivation path: m/1852'/1815'/0'/0/0
 *
 * @param xprv - Extended private key in bech32 format
 * @returns Payment key in bech32 format (ed25519_sk)
 */
export function derivePaymentKey(xprv: string): string {
  const rootKey = C.Bip32PrivateKey.from_bech32(xprv);
  const harden = (num: number) => 0x80000000 + num;

  // Cardano derivation path: m/1852'/1815'/0'/0/0
  const accountKey = rootKey
    .derive(harden(1852))  // Purpose: Shelley era
    .derive(harden(1815))  // Coin type: ADA
    .derive(harden(0));    // Account: 0

  const paymentKey = accountKey
    .derive(0)  // Chain: external
    .derive(0)  // Address index: 0
    .to_raw_key();

  return paymentKey.to_bech32();
}

/**
 * Load wallet from seed phrase or private key
 *
 * @param lucid - Lucid instance
 * @param seedPhrase - Optional 24-word seed phrase
 * @param privateKey - Optional extended private key (xprv) or payment key (ed25519_sk)
 */
export function loadWallet(
  lucid: LucidEvolution,
  seedPhrase?: string,
  privateKey?: string
): void {
  if (seedPhrase) {
    lucid.selectWallet.fromSeed(seedPhrase);
  } else if (privateKey) {
    // Check if it's an extended private key (starts with 'xprv')
    if (privateKey.startsWith('xprv')) {
      const paymentKeyBech32 = derivePaymentKey(privateKey);
      lucid.selectWallet.fromPrivateKey(paymentKeyBech32);
    } else {
      // Already a payment key
      lucid.selectWallet.fromPrivateKey(privateKey);
    }
  } else {
    throw new Error('Either seedPhrase or privateKey must be provided');
  }
}
