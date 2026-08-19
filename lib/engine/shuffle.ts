import type { Evolution, Option } from "./types";

/** Deterministic 32-bit hash (FNV-1a) so the same seed string always produces the same PRNG sequence. */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — small, fast, deterministic for a given 32-bit seed. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffles an evolution's 6 options deterministically for one attempt: same
 * (attemptId, evolutionId) always yields the same order (stable across a
 * page refresh), but different attempts see different orders. The caller is
 * responsible for persisting the resulting order so scoring always matches
 * what the candidate actually saw (plan.md's Engine Logic section).
 */
export function shuffleOptions(evolution: Evolution, attemptId: string): Option[] {
  const seed = hashSeed(`${attemptId}:${evolution.id}`);
  const random = mulberry32(seed);

  const shuffled = [...evolution.options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
