import { actions, Outcome, play, type Action } from './arena.js';

const name = process.argv[2] as Action | undefined;
if (!name || !(name in actions)) {
  console.error('Uso: npm run play -- golpe|bloqueo|hechizo');
  process.exitCode = 1;
} else {
  const { before, after } = play(actions[name]);
  const outcomes: Record<Outcome, string> = {
    [Outcome.PENDING]: 'pendiente',
    [Outcome.SURVIVED]: 'sobreviviste',
    [Outcome.VICTORY]: 'victoria',
    [Outcome.DEFEAT]: 'derrota',
  };
  console.log(`Antes: héroe ${before.heroHp} PV, monstruo ${before.monsterHp} PV`);
  console.log(`Acción: ${name}`);
  console.log(`Después: héroe ${after.heroHp} PV, monstruo ${after.monsterHp} PV`);
  console.log(`Resultado: ${outcomes[after.outcome]}`);
  console.log('Simulación local del contrato: todavía no es una transacción onchain.');
}
