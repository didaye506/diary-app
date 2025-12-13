"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

type Entry = {
  id: string;
  title: string | null;
  body: string;
  entry_date: string;   // YYYY-MM-DD
  created_at: string;   // fallback用
};

export default function EntryPage({ params }: { params: { id: string } }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const sb = supabaseBrowser();

      // ✅ ログインユーザー取得（他人のID直打ち対策）
      const {
        data: { user },
      } = await sb.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // ✅ entry_date を取る（これが編集導線のキー）
      const { data, error } = await sb
        .from("diary_entries")
        .select("id,title,body,entry_date,created_at")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setEntry(data as Entry);
      } else {
        setEntry(null);
      }
      setLoading(false);
    };

    load();
  }, [params.id]);

  const displayDate =
    entry?.entry_date
      ? new Date(`${entry.entry_date}T00:00:00`).toLocaleDateString("ja-JP")
      : entry?.created_at
        ? new Date(entry.created_at).toLocaleDateString("ja-JP")
        : "";

  return (
    <div className="min-h-[100dvh] w-full bg-[#090c11]">
      <div className="mx-auto w-full max-w-2xl px-5 py-8">
        <div className="mb-6 flex items-center justify-between">
          {/* ✅ 起点は /entries に統一 */}
          <Link href="/entries" className="text-sm text-white/55 hover:text-white/70">
            一覧へ戻る
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-white/35">{displayDate}</span>

            {/* ✅ 編集は /write?date=entry_date に集約 */}
            {entry?.entry_date ? (
              <Link
                href={`/write?date=${encodeURIComponent(entry.entry_date)}`}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/14"
              >
                編集
              </Link>
            ) : null}
          </div>
        </div>

        {loading && <p className="text-sm text-white/50">読み込み中...</p>}

        {!loading && !entry && (
          <p className="text-sm text-white/50">日記が見つかりませんでした。</p>
        )}

        {!loading && entry && (
          <>
            {entry.title ? <h1 className="mb-4 text-lg text-white/80">{entry.title}</h1> : null}
            <pre className="whitespace-pre-wrap break-words text-[15px] leading-7 text-white/75">
              {entry.body}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
