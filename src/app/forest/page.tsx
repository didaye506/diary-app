// src/app/forest/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ForestScene from "@/components/forest/ForestScene";
import { UX } from "@/lib/uxSpec";
import { layoutLights } from "@/lib/lightLayout";
import type { LightRenderItem } from "@/components/forest/LightsLayer";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

type EntryRow = { id: string; created_at: string };

function supabaseBrowser() {
  // 既存の supabaseClient.ts があるなら差し替えてOK
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

  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const highlightedId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const u = new URL(window.location.href);
    return u.searchParams.get("new");
  }, []);

  useEffect(() => {
    const load = async () => {
      const sb = supabaseBrowser();
      const fromIso = daysAgoIso(UX.forest.densityWindowDays - 1);

      const { data, error } = await sb
        .from("diary_entries")
        .select("id, created_at")
        .gte("created_at", fromIso)
        .order("created_at", { ascending: false });

      if (!error && data) setEntries(data as EntryRow[]);
    };

    load();
  }, []);

  const items: LightRenderItem[] = useMemo(() => {
    const ids = entries.map((e) => String(e.id));
    const points = layoutLights(ids, vp);
    const byId = new Map(points.map((p) => [p.id, p]));

    const n = Math.max(1, entries.length);

    return entries.map((e, idx) => {
      const depth01 = n === 1 ? 0 : clamp01(idx / (n - 1)); // idx=0最新=手前
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

      {/* 最小介入の導線（森はUIっぽくしないが、往復可能は担保） */}
      <div className="fixed inset-x-0 bottom-6 z-[2000] flex items-center justify-center gap-3">
        <Link
          href="/write"
          className="rounded-full bg-white/12 px-4 py-2 text-sm text-white/75 backdrop-blur-sm hover:bg-white/16"
        >
          書く
        </Link>
        <Link
          href="/lab"
          className="rounded-full bg-white/6 px-4 py-2 text-sm text-white/60 backdrop-blur-sm hover:bg-white/10"
        >
          小屋
        </Link>
      </div>
    </div>
  );
}
