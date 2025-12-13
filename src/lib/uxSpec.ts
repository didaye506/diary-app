// src/lib/uxSpec.ts
export const UX = {
  forest: {
    densityWindowDays: 50, // 確定
  },

  light: {
    // 「安全領域内」「最小距離制約あり」は確定だが数値未指定なので変数化（仕様0）
    safePaddingPx: 24,
    minDistancePx: 18,
    maxPlacementTries: 80,
  },

  deepFlicker: {
    // 確定仕様（6）
    walkRangePx: [0.4, 0.6] as const, // ±0.4〜±0.6
    updateIntervalMs: [250, 330] as const, // 250〜330msランダム（等間隔禁止）
    stallMs: [1000, 3000] as const, // 1〜3秒
    // 「手前20〜30%」の範囲内で固定値にしてブレを減らす（仕様6）
    frontLayerCutoff: 0.25,
  },

  recentGlow: {
    // 質的要件（仕様0 / 7）：一瞬強く→すぐ馴染む
    popMs: 350,
    settleMs: 650,
  },
} as const;

export type Season = "spring" | "summer" | "autumn" | "winter";

export function getSeason(d = new Date()): Season {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}
