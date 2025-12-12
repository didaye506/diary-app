// src/app/forest/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ForestScene from "@/components/forest/ForestScene";
import { UX } from "@/lib/uxSpec";
import { layoutLights } from "@/lib/lightLayout";
import type { LightRenderItem } from "@/components/forest/LightsLayer";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

type EntryRow = {
  id: string;
  created_at: string;
};

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export default function ForestPage() {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [vp, setVp] = useState({ w: 1200, h: 800 });

  const highlightedId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const u = new URL(window.location.href);
    return u.searchParams.get("new");
  }, []);

  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const load = async () => {
      const sb = supabaseBrowser();
      // 直近50日（確定）
      const fromIso = daysAgoIso(UX.forest.densityWindowDays - 1);

      const { data, error } = await sb
        .from("diary_entries")
        .select("id, created_at")
        .gte("created_at", fromIso)
        .order("created_at", { ascending: false });

      if (!error && data) setEntries(data as EntryRow[]);
      // error時は森は無言で静かに（祝福/診断/説明を出さない）
    };

    load();
  }, []);

  const items: LightRenderItem[] = useMemo(() => {
    const ids = entries.map((e) => String(e.id));
    const points = layoutLights(ids, vp);

    const byId = new Map(points.map((p) => [p.id, p]));
    const n = Math.max(1, entries.length);

    return entries.map((e, idx) => {
      const depth01 = n === 1 ? 0 : clamp01(idx / (n - 1)); // idx=0が最新=手前
      return {
        id: String(e.id),
        createdAt: e.created_at,
        depth01,
        point: byId.get(String(e.id))!,
      };
    });
  }, [entries, vp]);

  return (
    <div className="relative">
      <ForestScene items={items} highlightedId={highlightedId} />

      {/* UIっぽさを避けつつ「往復可能」だけ担保（最小介入） */}
      <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-3">
        <Link
          href="/write"
          className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70 backdrop-blur-sm hover:bg-white/15"
        >
          書く
        </Link>
        <Link
          href="/lab"
          className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/55 backdrop-blur-sm hover:bg-white/10"
        >
          小屋
        </Link>
      </div>
    </div>
  );
}
