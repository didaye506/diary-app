// src/components/forest/ForestScene.tsx
"use client";

import { useMemo } from "react";
import { UX, getSeason } from "@/lib/uxSpec";
import LightsLayer, { LightRenderItem } from "./LightsLayer";

function seasonPalette(season: ReturnType<typeof getSeason>) {
  // 暗色ベース + 季節で微変化（急変しない）
  switch (season) {
    case "spring":
      return { bg1: "#0b0f14", bg2: "#0a1016" };
    case "summer":
      return { bg1: "#070c10", bg2: "#070d12" };
    case "autumn":
      return { bg1: "#0b0d12", bg2: "#090b10" };
    case "winter":
    default:
      return { bg1: "#070a0f", bg2: "#06080d" };
  }
}

function shadowStyle(season: ReturnType<typeof getSeason>) {
  // 影（季節で位置と範囲が変わる）/ 空気表現は影のみ
  // 春：下部少量 / 夏：最小 / 秋：下部＋左右 / 冬：下半分
  switch (season) {
    case "spring":
      return {
        background:
          "radial-gradient(120% 40% at 50% 105%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.0) 60%)",
      };
    case "summer":
      return {
        background:
          "radial-gradient(90% 25% at 50% 110%, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.0) 55%)",
      };
    case "autumn":
      return {
        background:
          "radial-gradient(120% 45% at 50% 108%, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.0) 62%)," +
          "radial-gradient(40% 70% at 0% 65%, rgba(0,0,0,0.33) 0%, rgba(0,0,0,0.0) 68%)," +
          "radial-gradient(40% 70% at 100% 65%, rgba(0,0,0,0.33) 0%, rgba(0,0,0,0.0) 68%)",
      };
    case "winter":
    default:
      return {
        background:
          "radial-gradient(120% 80% at 50% 95%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.0) 70%)",
      };
  }
}

function TreeSilhouettes() {
  // 木（A）：左右端のみ / 中央は禁止
  // 霧・粒子・雪・雨なし（影のみ）なので、SVGは黒寄りのシルエットだけ
  return (
    <>
      <svg
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-[22%] opacity-35"
        viewBox="0 0 200 800"
        preserveAspectRatio="none"
      >
        <path
          d="M120 800 C80 650 140 520 90 400 C60 300 60 210 90 120 C105 75 110 40 98 0 L140 0 C135 60 150 95 160 130 C195 250 165 350 150 420 C125 555 155 670 175 800 Z"
          fill="black"
        />
        <path
          d="M70 800 C40 680 70 560 40 470 C15 390 18 320 40 250 C55 200 55 165 48 120 C42 80 40 45 44 0 L85 0 C82 55 90 100 100 140 C125 230 115 330 100 410 C85 520 100 650 120 800 Z"
          fill="black"
          opacity="0.7"
        />
      </svg>

      <svg
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-full w-[22%] opacity-35"
        viewBox="0 0 200 800"
        preserveAspectRatio="none"
      >
        <path
          d="M80 800 C120 650 60 520 110 400 C140 300 140 210 110 120 C95 75 90 40 102 0 L60 0 C65 60 50 95 40 130 C5 250 35 350 50 420 C75 555 45 670 25 800 Z"
          fill="black"
        />
        <path
          d="M130 800 C160 680 130 560 160 470 C185 390 182 320 160 250 C145 200 145 165 152 120 C158 80 160 45 156 0 L115 0 C118 55 110 100 100 140 C75 230 85 330 100 410 C115 520 100 650 80 800 Z"
          fill="black"
          opacity="0.7"
        />
      </svg>
    </>
  );
}

export default function ForestScene(props: {
  items: LightRenderItem[];
  highlightedId?: string | null;
}) {
  const season = useMemo(() => getSeason(new Date()), []);
  const pal = seasonPalette(season);

  // テキスト例外（補足文）: 原則なし → フラグで封印
  const FOREST_HINT_ENABLED = false;

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${pal.bg1} 0%, ${pal.bg2} 100%)`,
      }}
    >
      {/* 影（E） */}
      <div className="pointer-events-none absolute inset-0" style={shadowStyle(season)} />

      {/* 木（A）：左右端のみ */}
      <TreeSilhouettes />

      {/* 光（=日記） */}
      <LightsLayer items={props.items} highlightedId={props.highlightedId ?? null} />

      {/* 原則テキストなし（例外は封印） */}
      {FOREST_HINT_ENABLED && (
        <div
          className="pointer-events-none absolute left-0 right-0 top-[10%] mx-auto w-fit select-none px-4 text-center text-sm text-white/55"
          style={{
            // 遅延表示→消える（仕様補足）
            animation: "forestHint 7s ease-in-out both",
          }}
        >
          ここは、戻ってくる場所
          <style jsx>{`
            @keyframes forestHint {
              0% {
                opacity: 0;
                transform: translateY(6px);
              }
              15% {
                opacity: 0;
                transform: translateY(6px);
              }
              25% {
                opacity: 1;
                transform: translateY(0);
              }
              70% {
                opacity: 1;
                transform: translateY(0);
              }
              100% {
                opacity: 0;
                transform: translateY(-6px);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
