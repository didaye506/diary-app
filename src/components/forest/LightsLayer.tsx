// src/components/forest/LightsLayer.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { UX } from "@/lib/uxSpec";
import { LightPoint, toPx } from "@/lib/lightLayout";
import { useDeepFlicker } from "./useDeepFlicker";
import Link from "next/link";

export type LightRenderItem = {
  id: string;
  createdAt: string; // ISO
  depth01: number; // 0..1 (0=最新=手前)
  point: LightPoint; // 0..1
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function ease(v: number) {
  // きついコントラストを避けるため、少し丸める（数値指定なし→質的範囲）
  return Math.pow(clamp01(v), 0.6);
}

function useViewport() {
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return vp;
}

function LightDot(props: {
  id: string;
  depth01: number;
  x: number;
  y: number;
  highlighted: boolean;
}) {
  const flick = useDeepFlicker({ seed: props.id, depth01: props.depth01 });

  // 最近ほど明るめ・手前（仕様5.2）
  const front = 1 - props.depth01;
  const b = ease(front); // 0..1
  const opacity = 0.18 + 0.62 * b;

  // サイズも控えめに差をつける（UIっぽい記号化を避ける）
  const size = 6 + 10 * b;

  // 深層は暗め（仕様5.2）
  const glow = 10 + 26 * b;

  return (
    <Link
      href={`/entry/${encodeURIComponent(props.id)}`}
      aria-label="entry"
      className="absolute rounded-full"
      style={{
        left: props.x + flick.x,
        top: props.y + flick.y,
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
        // 祝福しない・評価しない：ただ“置かれたもの”
        background: `rgba(255,255,255,${opacity})`,
        boxShadow: `0 0 ${glow}px rgba(255,255,255,${0.10 + 0.22 * b})`,
        filter: "blur(0.1px)",
        transition: `box-shadow ${UX.recentGlow.settleMs}ms ease, background ${UX.recentGlow.settleMs}ms ease`,
        pointerEvents: "auto",
        // 手前/奥の印象（奥ほど小さく暗い＋背面）
        zIndex: Math.round(1000 * (1 - props.depth01)),
        outline: "none",
      }}
    >
      {/* 新規光：一瞬だけ強め→馴染む（仕様7） */}
      {props.highlighted && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: "rgba(255,255,255,0.55)",
            boxShadow: "0 0 46px rgba(255,255,255,0.35)",
            animation: `newGlow ${UX.recentGlow.popMs}ms ease-out both`,
          }}
        >
          <style jsx>{`
            @keyframes newGlow {
              0% {
                opacity: 1;
                transform: scale(1);
              }
              100% {
                opacity: 0;
                transform: scale(1.6);
              }
            }
          `}</style>
        </span>
      )}
    </Link>
  );
}

export default function LightsLayer(props: {
  items: LightRenderItem[];
  highlightedId: string | null;
}) {
  const vp = useViewport();

  const pxItems = useMemo(() => {
    return props.items.map((it) => {
      const p = toPx(it.point, vp, UX.light.safePaddingPx);
      return { ...it, px: p };
    });
  }, [props.items, vp]);

  return (
    <div className="absolute inset-0">
      {pxItems.map((it) => (
        <LightDot
          key={it.id}
          id={it.id}
          depth01={it.depth01}
          x={it.px.x}
          y={it.px.y}
          highlighted={props.highlightedId === it.id}
        />
      ))}
    </div>
  );
}
