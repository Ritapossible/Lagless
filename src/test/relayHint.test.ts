import { describe, it, expect } from "vitest";
import { isNewPlayer, relayHintActive, HINT_RELAYS, HINT_SECONDS, NEW_PLAYER_RUNS } from "@/game/relayHint";

describe("relay hint", () => {
  it("treats players with fewer than 3 finished runs as new", () => {
    expect(isNewPlayer(0)).toBe(true);
    expect(isNewPlayer(NEW_PLAYER_RUNS - 1)).toBe(true);
    expect(isNewPlayer(NEW_PLAYER_RUNS)).toBe(false);
  });

  it("shows at the start of a new player's run", () => {
    expect(relayHintActive(true, 0, 0)).toBe(true);
  });

  it("never shows for experienced players", () => {
    expect(relayHintActive(false, 0, 0)).toBe(false);
  });

  it("stops after two minutes", () => {
    expect(relayHintActive(true, HINT_SECONDS - 1, 0)).toBe(true);
    expect(relayHintActive(true, HINT_SECONDS, 0)).toBe(false);
  });

  it("stops once the player has picked up enough relays", () => {
    expect(relayHintActive(true, 10, HINT_RELAYS - 1)).toBe(true);
    expect(relayHintActive(true, 10, HINT_RELAYS)).toBe(false);
  });
});
