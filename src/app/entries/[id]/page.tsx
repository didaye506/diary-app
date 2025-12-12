// src/app/entry/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

export default function EntryPage({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState<string | null>(null);
  const [body, setBody] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const sb = supabaseBrowser();
      const { data, error } = await sb
        .from("diary_entries")
        .select("title, body, created_at")
        .eq("id", params.id)
        .single();

      if (!error && data) {
        setTitle(data.title ?? null);
        setBody(data.body ?? "");
        setCreatedAt(data.created_at ?? "");
      }
    };
    load();
  }, [params.id]);

  return (
    <div className="min-h-[100dvh] w-full bg-[#090c11]">
      <div className="mx-auto w-full max-w-2xl px-5 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/forest" className="text-sm text-white/55 hover:text-white/70">
            森へ戻る
          </Link>
          <span className="text-xs text-white/35">{createdAt ? new Date(createdAt).toLocaleString() : ""}</span>
        </div>

        {title ? <h1 className="mb-4 text-lg text-white/80">{title}</h1> : null}

        <pre className="whitespace-pre-wrap break-words text-[15px] leading-7 text-white/75">
          {body}
        </pre>
      </div>
    </div>
  );
}
