import * as RT from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, Outcome, Phase, type Ledger } from '../build/arena/contract/index.js';

export const actions = { golpe: 0n, bloqueo: 1n, hechizo: 2n } as const;
export type Action = keyof typeof actions;
type PrivateState = { readonly action: bigint };

const coinPublicKey = '0'.repeat(64);
const address = RT.sampleContractAddress();

const witnesses = {
  localAction: ({ privateState }: RT.WitnessContext<Ledger, PrivateState>): [PrivateState, bigint] =>
    [privateState, privateState.action],
};

export function play(action: bigint) {
  const privateState: PrivateState = { action };
  const contract = new Contract<PrivateState>(witnesses);
  const initial = contract.initialState(RT.createConstructorContext(privateState, coinPublicKey));
  const context = RT.createCircuitContext(address, coinPublicKey, initial.currentContractState, privateState);
  const before = ledger(context.currentQueryContext.state);
  const result = contract.impureCircuits.resolve(context);
  const after = ledger(result.context.currentQueryContext.state);
  return { contract, before, after, context: result.context };
}

export { Outcome, Phase, ledger };
