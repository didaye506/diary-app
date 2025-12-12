// src/lib/seededRng.ts

// 文字列/数値seedから安定乱数を生成（同じseedなら同じ列）
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashToSeed(input: string | number): number {
  const s = String(input);
  let h = 2166136261; // FNV-ish
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rngFromSeed(seed: string | number) {
  return mulberry32(hashToSeed(seed));
}

export function randBetween(rand: () => number, min: number, max: number) {
  return min + (max - min) * rand();
}

export function randInt(rand: () => number, minIncl: number, maxIncl: number) {
  const v = Math.floor(randBetween(rand, minIncl, maxIncl + 1));
  return Math.max(minIncl, Math.min(maxIncl, v));
}
