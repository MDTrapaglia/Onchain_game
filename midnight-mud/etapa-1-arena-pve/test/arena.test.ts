import { describe, expect, it } from 'vitest';
import { actions, ledger, Outcome, Phase, play } from '../src/arena.js';

describe('Arena PvE de un turno', () => {
  it.each([
    ['golpe', actions.golpe, 7n, 3n, Outcome.SURVIVED],
    ['bloqueo', actions.bloqueo, 9n, 6n, Outcome.SURVIVED],
    ['hechizo', actions.hechizo, 8n, 0n, Outcome.VICTORY],
  ])('%s resuelve según las reglas', (_name, action, hero, monster, outcome) => {
    const { before, after } = play(action);
    expect(before).toMatchObject({ heroHp: 10n, monsterHp: 7n, phase: Phase.OPEN });
    expect(after).toMatchObject({ heroHp: hero, monsterHp: monster, phase: Phase.RESOLVED, outcome });
    expect(after.heroHp).toBeGreaterThanOrEqual(0n);
    expect(after.monsterHp).toBeGreaterThanOrEqual(0n);
  });

  it('rechaza acciones fuera del rango incluso si las aporta otro cliente', () => {
    expect(() => play(3n)).toThrow('Invalid action');
    expect(() => play(255n)).toThrow('Invalid action');
  });

  it('rechaza repetir una resolución', () => {
    const { contract, context } = play(actions.golpe);
    expect(() => contract.impureCircuits.resolve(context)).toThrow('Encounter already resolved');
    expect(ledger(context.currentQueryContext.state).monsterHp).toBe(3n);
  });

  it('es determinista para el mismo estado y acción', () => {
    expect(play(actions.hechizo).after).toEqual(play(actions.hechizo).after);
  });
});
