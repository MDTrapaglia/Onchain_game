import nacl from 'tweetnacl';

/**
 * Verify Ed25519 signature
 * @param messageHash - SHA-256 hash of the message (32 bytes)
 * @param signature - Ed25519 signature (hex string, 128 chars = 64 bytes)
 * @param publicKey - Ed25519 public key (hex string, 64 chars = 32 bytes)
 * @returns true if signature is valid
 */
export function verifyEd25519Signature(
  messageHash: Buffer,
  signature: string,
  publicKey: string
): boolean {
  try {
    // Convert hex strings to Uint8Array
    const signatureBytes = Buffer.from(signature, 'hex');
    const publicKeyBytes = Buffer.from(publicKey, 'hex');

    // Validate lengths
    if (signatureBytes.length !== 64) {
      console.error(`Invalid signature length: ${signatureBytes.length} (expected 64)`);
      return false;
    }

    if (publicKeyBytes.length !== 32) {
      console.error(`Invalid public key length: ${publicKeyBytes.length} (expected 32)`);
      return false;
    }

    if (messageHash.length !== 32) {
      console.error(`Invalid message hash length: ${messageHash.length} (expected 32)`);
      return false;
    }

    // Verify signature using TweetNaCl
    const isValid = nacl.sign.detached.verify(
      new Uint8Array(messageHash),
      new Uint8Array(signatureBytes),
      new Uint8Array(publicKeyBytes)
    );

    return isValid;
  } catch (error) {
    console.error('Error verifying Ed25519 signature:', error);
    return false;
  }
}

/**
 * Generate Ed25519 keypair
 * @returns {publicKey, secretKey} as hex strings
 */
export function generateEd25519Keypair(): { publicKey: string; secretKey: string } {
  const keypair = nacl.sign.keyPair();

  return {
    publicKey: Buffer.from(keypair.publicKey).toString('hex'),
    secretKey: Buffer.from(keypair.secretKey).toString('hex'),
  };
}

/**
 * Sign message with Ed25519
 * @param messageHash - SHA-256 hash of message (32 bytes)
 * @param secretKey - Ed25519 secret key (hex string, 128 chars = 64 bytes)
 * @returns signature as hex string
 */
export function signEd25519(messageHash: Buffer, secretKey: string): string {
  const secretKeyBytes = Buffer.from(secretKey, 'hex');

  if (secretKeyBytes.length !== 64) {
    throw new Error(`Invalid secret key length: ${secretKeyBytes.length} (expected 64)`);
  }

  if (messageHash.length !== 32) {
    throw new Error(`Invalid message hash length: ${messageHash.length} (expected 32)`);
  }

  const signature = nacl.sign.detached(
    new Uint8Array(messageHash),
    new Uint8Array(secretKeyBytes)
  );

  return Buffer.from(signature).toString('hex');
}
