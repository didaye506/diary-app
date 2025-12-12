// src/components/forest/useDeepFlicker.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UX } from "@/lib/uxSpec";
import { rngFromSeed, randBetween } from "@/lib/seededRng";

type Offset = { x: number; y: number };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function useDeepFlicker(params: {
  seed: string;
  depth01: number; // 0=最新(手前) .. 1=最古(奥)
}) {
  const { seed, depth01 } = params;

  // 揺らぎは「手前20〜30%」まで。奥ほどさらに減衰。
  const cutoff = UX.deepFlicker.frontLayerCutoff;
  const strength = useMemo(() => {
    if (depth01 > cutoff) return 0;
    const t = 1 - depth01 / cutoff; // 1..0
    // 深層ほどほぼ静止に見せる（減衰）
    return clamp(t, 0, 1);
  }, [depth01]);

  const rand = useMemo(() => rngFromSeed(seed), [seed]);
  const timerRef = useRef<number | null>(null);
  const stallUntilRef = useRef<number>(0);

  const offsetRef = useRef<Offset>({ x: 0, y: 0 });
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  useEffect(() => {
    // 揺らぎが無効な層は完全静止
    if (strength <= 0) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    const scheduleNext = (delayMs: number) => {
      timerRef.current = window.setTimeout(tick, delayMs);
    };

    const tick = () => {
      const now = Date.now();

      // 1〜3秒の停滞を入れる（常時揺れ続ける禁止）
      if (now < stallUntilRef.current) {
        // 停止中も内部状態は保持（offsetRefは保持したまま）
        const nextDelay = randBetween(rand, UX.deepFlicker.updateIntervalMs[0], UX.deepFlicker.updateIntervalMs[1]);
        scheduleNext(nextDelay);
        return;
      }

      // たまに stall に入る（周期運動にならないよう、確率ベース）
      const stallChance = 0.22; // 数値指定なし→質的要件の範囲で調整可能
      if (rand() < stallChance) {
        const stall = randBetween(rand, UX.deepFlicker.stallMs[0], UX.deepFlicker.stallMs[1]);
        stallUntilRef.current = now + stall;
        const nextDelay = randBetween(rand, UX.deepFlicker.updateIntervalMs[0], UX.deepFlicker.updateIntervalMs[1]);
        scheduleNext(nextDelay);
        return;
      }

      // ランダムウォーク（周期禁止）
      const amp = randBetween(rand, UX.deepFlicker.walkRangePx[0], UX.deepFlicker.walkRangePx[1]) * strength;
      const dx = randBetween(rand, -amp, amp);
      const dy = randBetween(rand, -amp, amp);

      // 目で追える移動を避けるため、中心(0)へわずかに戻す減衰（深層の「ほぼ静止」感）
      const cur = offsetRef.current;
      const next = {
        x: (cur.x + dx) * 0.9,
        y: (cur.y + dy) * 0.9,
      };

      // 逸脱を防ぐ保険（仕様に反しない範囲で）
      offsetRef.current = {
        x: clamp(next.x, -2, 2),
        y: clamp(next.y, -2, 2),
      };
      setOffset(offsetRef.current);

      // 250〜330msランダム（等間隔禁止）
      const nextDelay = randBetween(rand, UX.deepFlicker.updateIntervalMs[0], UX.deepFlicker.updateIntervalMs[1]);
      scheduleNext(nextDelay);
    };

    // 初回: 少し待ってから（等間隔感を避ける）
    scheduleNext(randBetween(rand, 120, 240));

    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [rand, strength]);

  return offset;
}
