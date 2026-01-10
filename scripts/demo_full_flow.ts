import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Demo: Full game flow
 * Demonstrates the complete lifecycle of a game session
 *
 * Flow:
 * 1. Register player
 * 2. Start game session
 * 3. Simulate gameplay (stat changes)
 * 4. Finalize session with signature
 *
 * Usage:
 *   npm run demo:full-flow
 */

const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'demo_token';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🎮 DEMO: Full Game Flow\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Mock data for demo
  const playerData = {
    wallet_address: 'addr1_test_demo_wallet_address_12345678',
    nft_policy_id: 'demo_policy_id_1234567890abcdef',
    nft_asset_name: 'demo_player_nft',
    nft_tx_hash: 'demo_tx_hash_1234567890',
    stake_address: 'stake1_test_demo_stake_address',
    script_address: 'addr1_test_script_address_12345678',
  };

  try {
    // Step 1: Register player
    console.log('📝 Step 1: Registering player...');
    const registerResponse = await axios.post(
      `${API_URL}/api/players/register?token=${ACCESS_TOKEN}`,
      playerData
    );

    const player = registerResponse.data.player;
    console.log(`✅ Player registered: ${player.id}`);
    console.log(`   Wallet: ${player.wallet_address}`);
    console.log(`   Initial HP: ${player.current_hp}`);
    console.log(`   Initial EXP: ${player.current_exp}\n`);

    await sleep(1000);

    // Step 2: Start game session
    console.log('🎯 Step 2: Starting game session...');
    const sessionResponse = await axios.post(
      `${API_URL}/api/sessions/start?token=${ACCESS_TOKEN}`,
      {
        wallet_address: playerData.wallet_address,
        nft_policy_id: playerData.nft_policy_id,
        nft_asset_name: playerData.nft_asset_name,
      }
    );

    const session = sessionResponse.data.session;
    console.log(`✅ Session started: ${session.id}`);
    console.log(`   Session number: ${session.session_number}`);
    console.log(`   Status: ${session.status}`);
    console.log(`   Start stats:`);
    console.log(`     HP: ${session.start_hp}`);
    console.log(`     EXP: ${session.start_exp}`);
    console.log(`     AGI: ${session.start_agility}`);
    console.log(`     STR: ${session.start_strength}`);
    console.log(`     INT: ${session.start_intelligence}`);
    console.log(`     SPD: ${session.start_speed}\n`);

    await sleep(1000);

    // Step 3: Simulate gameplay
    console.log('⚔️  Step 3: Simulating gameplay...');
    console.log('   Player fights monsters, gains EXP, levels up...');
    console.log('   (This would involve Update redeemer transactions on-chain)\n');

    await sleep(2000);

    // Calculate final stats after gameplay
    const finalStats = {
      hp: session.start_hp - 15,         // Lost 15 HP in combat
      exp: session.start_exp + 250,      // Gained 250 EXP
      agility: session.start_agility + 5,    // +5 agility
      strength: session.start_strength + 8,  // +8 strength
      intelligence: session.start_intelligence + 3, // +3 intelligence
      speed: session.start_speed + 4,    // +4 speed
    };

    console.log('📊 Final stats after gameplay:');
    console.log(`   HP: ${session.start_hp} → ${finalStats.hp} (${finalStats.hp - session.start_hp})`);
    console.log(`   EXP: ${session.start_exp} → ${finalStats.exp} (+${finalStats.exp - session.start_exp})`);
    console.log(`   AGI: ${session.start_agility} → ${finalStats.agility} (+${finalStats.agility - session.start_agility})`);
    console.log(`   STR: ${session.start_strength} → ${finalStats.strength} (+${finalStats.strength - session.start_strength})`);
    console.log(`   INT: ${session.start_intelligence} → ${finalStats.intelligence} (+${finalStats.intelligence - session.start_intelligence})`);
    console.log(`   SPD: ${session.start_speed} → ${finalStats.speed} (+${finalStats.speed - session.start_speed})\n`);

    await sleep(1000);

    // Step 4: Finalize session
    console.log('🏁 Step 4: Finalizing session...');
    const finalizeResponse = await axios.post(
      `${API_URL}/api/sessions/${session.id}/finalize?token=${ACCESS_TOKEN}`,
      {
        final_stats: finalStats,
      }
    );

    const finalizedSession = finalizeResponse.data.session;
    const signature = finalizeResponse.data.signature;

    console.log(`✅ Session finalized: ${finalizedSession.id}`);
    console.log(`   Status: ${finalizedSession.status}`);
    console.log(`   Ed25519 signature generated:`);
    console.log(`     Hash: ${signature.hash.substring(0, 32)}...`);
    console.log(`     Signature: ${signature.signature.substring(0, 32)}...`);
    console.log(`     Public Key: ${signature.publicKey.substring(0, 32)}...\n`);

    await sleep(1000);

    // Step 5: Get statistics
    console.log('📊 Step 5: Fetching statistics...');
    const statsResponse = await axios.get(
      `${API_URL}/api/statistics?token=${ACCESS_TOKEN}`
    );

    const stats = statsResponse.data;
    console.log('✅ System statistics:');
    console.log(`   Players: ${stats.players.total}`);
    console.log(`   Sessions:`);
    console.log(`     Total: ${stats.sessions.total}`);
    console.log(`     Active: ${stats.sessions.active}`);
    console.log(`     Completed: ${stats.sessions.completed}`);
    console.log(`   Transactions:`);
    console.log(`     Total: ${stats.transactions.total}`);
    console.log(`     Pending: ${stats.transactions.pending}`);
    console.log(`     Confirmed: ${stats.transactions.confirmed}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DEMO COMPLETED SUCCESSFULLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Next steps for on-chain integration:');
    console.log('1. Compile Aiken contracts: cd onchain/game-engine && aiken build');
    console.log('2. Mint Identity NFT: npm run game:mint-nft');
    console.log('3. Lock NFT in script: npm run game:create-player');
    console.log('4. Start session with Play redeemer');
    console.log('5. Update stats with Update redeemer (during gameplay)');
    console.log('6. Finalize with Finalize redeemer (end session)\n');

  } catch (error: any) {
    console.error('❌ Error during demo:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(error.message);
    }
    console.error('\n💡 Make sure the API server is running: npm run dev\n');
  }
}

main().catch(console.error);
