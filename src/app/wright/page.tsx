// src/app/write/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

export default function WritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!body.trim()) return; // 空は保存しない（評価UIは出さない）
    setSaving(true);
    try {
      const sb = supabaseBrowser();
      const { data, error } = await sb
        .from("diary_entries")
        .insert({ title: title.trim() || null, body })
        .select("id")
        .single();

      if (!error && data?.id) {
        router.push(`/forest?new=${encodeURIComponent(String(data.id))}`);
        return;
      }
      // 失敗しても派手に言わない（ただ留まる）
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] w-full"
      style={{
        // 背景単色（仕様7）
        background: "#0a0d12",
      }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-5 py-8">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="（任意）"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 outline-none placeholder:text-white/25"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder=""
          className="min-h-[55dvh] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white/80 outline-none"
        />
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => router.push("/forest")}
            className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/55 hover:bg-white/10"
            disabled={saving}
          >
            戻る
          </button>
          <button
            onClick={save}
            className="rounded-full bg-white/12 px-4 py-2 text-sm text-white/70 hover:bg-white/18 disabled:opacity-50"
            disabled={saving}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
