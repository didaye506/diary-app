"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ProGate } from "@/components/ProGate";

type DiaryEntry = {
  id: string;
  title: string;
  mood: string;
  created_at: string;
};

const moodToEmoji = (mood: string) => {
  switch (mood) {
    case "good":
      return "😊";
    case "bad":
      return "😢";
    default:
      return "😐";
  }
};

export default function EntriesPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setEntries((data ?? []) as DiaryEntry[]);
      setLoading(false);
    };

    load();
  }, []);

  return (
    <ProGate>
      <main className="min-h-screen max-w-3xl mx-auto px-4 py-8 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">日記一覧</h1>

          <Link
            href="/entries/new"
            className="text-sm px-3 py-2 border rounded-md hover:bg-gray-50"
          >
            新規作成
          </Link>
        </header>

        {loading && <p>読み込み中...</p>}

        {!loading && entries.length === 0 && (
          <p className="text-sm text-gray-600">
            まだ日記がありません。「新規作成」から追加できます。
          </p>
        )}

        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border p-4 hover:bg-gray-50 transition"
            >
              <Link href={`/entries/${entry.id}`}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{entry.title}</h2>
                  <span className="text-2xl">{moodToEmoji(entry.mood)}</span>
                </div>

                <p className="text-xs text-gray-500">
                  {new Date(entry.created_at).toLocaleDateString("ja-JP")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </ProGate>
  );
}
