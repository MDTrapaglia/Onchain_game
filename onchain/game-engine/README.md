# Game Engine Smart Contracts

On-chain game engine validators written in Aiken for Cardano blockchain.

## Validators

### 1. game.ak
Main game validator that enforces:
- Player stat immutability
- Ed25519 signature verification
- State transition rules (linaje)
- Identity NFT ownership

### 2. nft.ak
Minting policy for Identity NFT:
- One-time mint per player
- Unique token name per wallet

## Building

```bash
cd onchain/game-engine
aiken build
```

## Testing

```bash
aiken check
```

## Stats Schema

```aiken
PlayerStats {
  hp: Int,           // Hit Points
  exp: Int,          // Experience
  agility: Int,
  strength: Int,
  intelligence: Int,
  speed: Int
}
```

## Security Model

The game uses Ed25519 signatures to validate stat updates:
1. Player starts game session (Play redeemer)
2. Backend tracks gameplay off-chain
3. Stats update during session (Update redeemer with linaje validation)
4. Backend signs final stats
5. Player finalizes session (Finalize redeemer validates signature)
