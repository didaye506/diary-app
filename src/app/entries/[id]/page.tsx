"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

type DiaryEntry = {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  entry_date: string | null;
  created_at: string;
};

type DiaryAnalysis = {
  id: string;
  diary_id: string;
  user_id: string;
  summary: string | null;
  main_emotions: string[] | null; // text[]
  key_themes: string[] | null; // text[]
  advice: string | null;
};

function safeDateLabel(dateStr?: string | null) {
  if (!dateStr) return "";
  try {
    // entry_date は YYYY-MM-DD を想定
    return format(new Date(`${dateStr}T00:00:00`), "yyyy/MM/dd");
  } catch {
    return dateStr;
  }
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/75">
      {children}
    </span>
  );
}

function Card({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-white/85">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function EntryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const entryId = params?.id;

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [analysis, setAnalysis] = useState<DiaryAnalysis | null>(null);

  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const displayDate = useMemo(() => {
    if (!entry) return "";
    // entry_date があればそれ、無ければ created_at
    if (entry.entry_date) return safeDateLabel(entry.entry_date);
    try {
      return format(new Date(entry.created_at), "yyyy/MM/dd");
    } catch {
      return "";
    }
  }, [entry]);

  // 初回ロード：日記 + 分析（あれば）
  useEffect(() => {
    if (!entryId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      setAnalysisError(null);

      const sb = supabaseBrowser();

      // ユーザー確認（RLS前提）
      const {
        data: { user },
      } = await sb.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 日記本体
      const { data: e, error: eErr } = await sb
        .from("diary_entries")
        .select("id,user_id,title,body,entry_date,created_at")
        .eq("id", entryId)
        .eq("user_id", user.id)
        .single();

      if (eErr || !e) {
        setError("日記を読み込めませんでした。");
        setEntry(null);
        setAnalysis(null);
        setLoading(false);
        return;
      }

      setEntry(e as DiaryEntry);

      // 分析（無くてもOK）
      const { data: a, error: aErr } = await sb
        .from("diary_analysis")
        .select("id,diary_id,user_id,summary,main_emotions,key_themes,advice")
        .eq("diary_id", entryId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (aErr) {
        // 取れないのは致命傷じゃないので保持だけ
        console.error("ANALYSIS FETCH ERROR", aErr);
        setAnalysisError("分析結果の取得に失敗しました。");
      }

      setAnalysis((a ?? null) as DiaryAnalysis | null);
      setLoading(false);
    };

    load();
  }, [entryId, router]);

  // 再分析（or 初回分析）実行
  const runAnalysis = async () => {
    if (!entryId) return;

    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/analyze-diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "analysis failed");
      }

      // 成功したら再取得
      const sb = supabaseBrowser();
      const {
        data: { user },
      } = await sb.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: a, error: aErr } = await sb
        .from("diary_analysis")
        .select("id,diary_id,user_id,summary,main_emotions,key_themes,advice")
        .eq("diary_id", entryId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (aErr) {
        console.error("ANALYSIS REFETCH ERROR", aErr);
        throw new Error("分析結果の再取得に失敗しました。");
      }

      setAnalysis((a ?? null) as DiaryAnalysis | null);
    } catch (e: any) {
      console.error("ANALYSIS RUN ERROR", e);
      setAnalysisError(e?.message ?? "分析に失敗しました。");
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#090c11]">
      <div className="mx-auto w-full max-w-3xl px-5 py-8">
        {/* 上部バー */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/entries"
            className="text-sm text-white/60 hover:text-white/80"
          >
            一覧へ戻る
          </Link>

          <div className="text-xs text-white/40">{displayDate}</div>
        </div>

        {loading ? (
          <div className="text-sm text-white/60">読み込み中…</div>
        ) : error ? (
          <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        ) : entry ? (
          <div className="space-y-4">
            {/* タイトル */}
            <div>
              <h1 className="text-xl font-semibold text-white/85">
                {entry.title?.trim() ? entry.title : "（無題）"}
              </h1>
            </div>

            {/* 本文 */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <pre className="whitespace-pre-wrap break-words text-[15px] leading-7 text-white/80">
                {entry.body}
              </pre>
            </section>

            {/* AI分析 */}
            <Card
              title="AI分析"
              right={
                analysisLoading ? (
                  <span className="text-xs text-white/45">分析中…</span>
                ) : analysis ? (
                  <span className="text-xs text-white/45">表示中</span>
                ) : (
                  <span className="text-xs text-white/45">未分析</span>
                )
              }
            >
              {/* エラー */}
              {analysisError ? (
                <div className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {analysisError}
                </div>
              ) : null}

              {/* 未分析 or 失敗時：再分析 */}
              {!analysis ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-white/60">
                    まだ分析がありません。必要なら再分析できます。
                  </div>
                  <button
                    onClick={runAnalysis}
                    disabled={analysisLoading}
                    className="rounded-full bg-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/25 disabled:opacity-40"
                  >
                    {analysisLoading ? "分析中…" : "再分析する"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div>
                    <div className="mb-1 text-xs text-white/50">要約</div>
                    <div className="text-sm leading-6 text-white/80">
                      {analysis.summary?.trim() ? analysis.summary : "（なし）"}
                    </div>
                  </div>

                  {/* Emotions */}
                  <div>
                    <div className="mb-2 text-xs text-white/50">感情</div>
                    <div className="flex flex-wrap gap-2">
                      {(analysis.main_emotions ?? []).length ? (
                        (analysis.main_emotions ?? []).map((e, i) => (
                          <Chip key={`${e}-${i}`}>{e}</Chip>
                        ))
                      ) : (
                        <span className="text-sm text-white/55">（なし）</span>
                      )}
                    </div>
                  </div>

                  {/* Themes */}
                  <div>
                    <div className="mb-2 text-xs text-white/50">テーマ</div>
                    <div className="flex flex-wrap gap-2">
                      {(analysis.key_themes ?? []).length ? (
                        (analysis.key_themes ?? []).map((t, i) => (
                          <Chip key={`${t}-${i}`}>{t}</Chip>
                        ))
                      ) : (
                        <span className="text-sm text-white/55">（なし）</span>
                      )}
                    </div>
                  </div>

                  {/* Advice */}
                  <div>
                    <div className="mb-1 text-xs text-white/50">アドバイス</div>
                    <div className="text-sm leading-6 text-white/80">
                      {analysis.advice?.trim() ? analysis.advice : "（なし）"}
                    </div>
                  </div>

                  {/* 再分析ボタン（分析があっても出す：いつでも更新可） */}
                  <div className="flex justify-end">
                    <button
                      onClick={runAnalysis}
                      disabled={analysisLoading}
                      className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/15 disabled:opacity-40"
                    >
                      {analysisLoading ? "分析中…" : "再分析で更新"}
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
