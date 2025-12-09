// src/app/insights/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ProGate } from "@/components/ProGate";

type DiaryEntry = {
  id: string;
  title: string;
  mood: string | null;
  created_at: string;
};

type DiaryAnalysisRow = {
  id: string;
  summary: string | null;
  main_emotions: string[] | null;
  key_themes: string[] | null;
  advice: string | null;
  created_at: string;
  diary_entries: DiaryEntry[] | null;
};

function buildCounts(items: (string[] | null | undefined)[]) {
  const counts: Record<string, number> = {};

  for (const arr of items) {
    if (!arr) continue;
    for (const word of arr) {
      if (!word) continue;
      counts[word] = (counts[word] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

const moodToEmoji = (mood: string | null) => {
  switch (mood) {
    case "good":
      return "😊";
    case "bad":
      return "😢";
    default:
      return "😐";
  }
};

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<DiaryAnalysisRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("解析結果を表示するにはログインが必要です。");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("diary_analysis")
        .select(
          `
          id,
          summary,
          main_emotions,
          key_themes,
          advice,
          created_at,
          diary_entries (
            id,
            title,
            mood,
            created_at
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("failed to load insights:", error);
        setError("解析結果の読み込み中にエラーが発生しました。");
      } else {
        setAnalyses((data ?? []) as DiaryAnalysisRow[]);
      }

      setLoading(false);
    };

    fetchInsights();
  }, []);

  const topEmotions = buildCounts(analyses.map((row) => row.main_emotions));
  const topThemes = buildCounts(analyses.map((row) => row.key_themes));

  return (
    <ProGate>
      <main className="min-h-screen max-w-3xl mx-auto px-4 py-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">自己分析まとめ（Insights）</h1>
          <p className="text-sm text-gray-600">
            これまでのAI解析結果をもとに、よく出ている感情やテーマをざっくり可視化します。
          </p>
        </header>

        {loading && <p>読み込み中...</p>}

        {error && !loading && (
          <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
        )}

        {!loading && !error && (
          <>
            {/* 集計カード */}
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4 space-y-2">
                <h2 className="font-semibold mb-1">💓 よく出ている感情 TOP5</h2>
                {topEmotions.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    まだ解析結果がありません。「AIに分析してもらう」を試してみてください。
                  </p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {topEmotions.map(([emotion, count]) => (
                      <li
                        key={emotion}
                        className="flex items-center justify-between"
                      >
                        <span>{emotion}</span>
                        <span className="text-gray-500 text-xs">{count} 回</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border p-4 space-y-2">
                <h2 className="font-semibold mb-1">🎯 よく出ているテーマ TOP5</h2>
                {topThemes.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    まだ解析結果がありません。「AIに分析してもらう」を試してみてください。
                  </p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {topThemes.map(([theme, count]) => (
                      <li
                        key={theme}
                        className="flex items-center justify-between"
                      >
                        <span>{theme}</span>
                        <span className="text-gray-500 text-xs">{count} 回</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* 最近の解析結果リスト */}
            <section className="space-y-3">
              <h2 className="font-semibold">📝 最近の解析結果</h2>

              {analyses.length === 0 ? (
                <p className="text-sm text-gray-500">
                  まだ解析結果がありません。日記の詳細ページから「AIに分析してもらう」を実行すると、ここに表示されます。
                </p>
              ) : (
                <ul className="space-y-3">
                  {analyses.map((row) => {
                    const entry = row.diary_entries?.[0] ?? null;

                    return (
                      <li
                        key={row.id}
                        className="rounded-xl border p-4 space-y-2 text-sm"
                      >
                        {entry && (
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              href={`/entries/${entry.id}`}
                              className="font-semibold hover:underline"
                            >
                              {entry.title}
                            </Link>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span>
                                {new Date(
                                  entry.created_at
                                ).toLocaleDateString("ja-JP")}
                              </span>
                              <span className="text-lg">
                                {moodToEmoji(entry.mood)}
                              </span>
                            </div>
                          </div>
                        )}

                        {row.summary && (
                          <p className="text-gray-800">{row.summary}</p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {row.main_emotions?.map((e) => (
                            <span
                              key={e}
                              className="rounded-full border px-2 py-0.5 text-xs text-gray-700"
                            >
                              {e}
                            </span>
                          ))}
                          {row.key_themes?.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border px-2 py-0.5 text-xs text-gray-700"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>

                        {row.advice && (
                          <p className="text-xs text-gray-600 mt-1">
                            ✨ アドバイス：{row.advice}
                          </p>
                        )}

                        <p className="text-[10px] text-gray-400 mt-1">
                          解析日時：
                          {new Date(row.created_at).toLocaleString("ja-JP")}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </ProGate>
  );
}
