// src/lib/lightLayout.ts
import { UX } from "./uxSpec";
import { rngFromSeed, randBetween } from "./seededRng";

export type LightPoint = {
  id: string;
  x: number; // 0..1 (relative)
  y: number; // 0..1 (relative)
};

type Size = { w: number; h: number };

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 確定要件:
 * - 安全領域内
 * - 擬似ランダム
 * - seed = entry_id により位置固定
 * - 最小距離制約あり（重なり回避）
 */
export function layoutLights(
  ids: string[],
  viewport: Size,
  opts?: {
    safePaddingPx?: number;
    minDistancePx?: number;
    maxTries?: number;
  }
): LightPoint[] {
  const pad = opts?.safePaddingPx ?? UX.light.safePaddingPx;
  const minD = opts?.minDistancePx ?? UX.light.minDistancePx;
  const maxTries = opts?.maxTries ?? UX.light.maxPlacementTries;

  const usableW = Math.max(1, viewport.w - pad * 2);
  const usableH = Math.max(1, viewport.h - pad * 2);

  const placed: { id: string; x: number; y: number }[] = [];

  for (const id of ids) {
    const r = rngFromSeed(id); // 位置固定の核
    let best: { x: number; y: number } | null = null;
    let bestScore = -Infinity;

    for (let i = 0; i < maxTries; i++) {
      const px = pad + randBetween(r, 0, usableW);
      const py = pad + randBetween(r, 0, usableH);

      const candidate = { x: px, y: py };
      let ok = true;
      let nearest = Infinity;

      for (const p of placed) {
        const d = dist(candidate, p);
        nearest = Math.min(nearest, d);
        if (d < minD) {
          ok = false;
          break;
        }
      }

      // 最小距離が満たせない場合でも、できるだけ離れる点を選ぶ（重なり回避の質を上げる）
      const score = nearest;
      if (ok) {
        best = candidate;
        break;
      } else if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    const chosen = best ?? { x: pad + usableW * 0.5, y: pad + usableH * 0.5 };
    placed.push({ id, x: chosen.x, y: chosen.y });
  }

  // 0..1 正規化して返す（レスポンシブに強い）
  return placed.map((p) => ({
    id: p.id,
    x: (p.x - pad) / usableW,
    y: (p.y - pad) / usableH,
  }));
}

export function toPx(point: LightPoint, viewport: Size, padPx = UX.light.safePaddingPx) {
  const usableW = Math.max(1, viewport.w - padPx * 2);
  const usableH = Math.max(1, viewport.h - padPx * 2);
  return {
    x: padPx + point.x * usableW,
    y: padPx + point.y * usableH,
  };
}
