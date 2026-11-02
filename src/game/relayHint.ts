// First-run coaching: point new players at the relays that refill the latency budget

/** Players with fewer finished runs than this count as new */
export const NEW_PLAYER_RUNS = 3;
/** The hint stops after this many seconds of a run... */
export const HINT_SECONDS = 120;
/** ...or once the player has picked up this many relays, whichever comes first */
export const HINT_RELAYS = 3;

export function isNewPlayer(totalRuns: number): boolean {
  return totalRuns < NEW_PLAYER_RUNS;
}

export function relayHintActive(newPlayer: boolean, runSeconds: number, relaysCollected: number): boolean {
  return newPlayer && runSeconds < HINT_SECONDS && relaysCollected < HINT_RELAYS;
}
