// src/app/lab/page.tsx
"use client";

import Link from "next/link";

export default function LabPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#070a0f]">
      <div className="mx-auto w-full max-w-2xl px-5 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/forest" className="text-sm text-white/55 hover:text-white/70">
            森へ戻る
          </Link>
        </div>

        {/* ここは “研究の場”。分析UIは次フェーズで（今は分離構造だけ固定） */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm text-white/70">小屋（Research）</div>
          <div className="mt-2 text-sm leading-6 text-white/50">
            ここは任意で入る場所。森には分析を持ち込まない。
          </div>
        </div>
      </div>
    </div>
  );
}
