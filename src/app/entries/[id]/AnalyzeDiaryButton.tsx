// src/app/entries/[id]/AnalyzeDiaryButton.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // ← 追加

type DiaryAnalysis = {
  summary?: string;
  mainEmotions?: string[];
  keyThemes?: string[];
  advice?: string;
  raw?: string;
};

  type AnalyzeDiaryButtonProps = {
    diaryId: string;   // ★ これを追加
    diaryText: string;
  };

export function AnalyzeDiaryButton({ diaryId, diaryText }: AnalyzeDiaryButtonProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DiaryAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze-diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diaryText }),
      });

      let responseData: any = {};
      try {
        responseData = await res.json();
      } catch {
        responseData = {};
      }

      if (!res.ok) {
        console.error("API error:", res.status, responseData);
        const message =
          responseData.detail ||
          responseData.error ||
          `API error: ${res.status}`;
        throw new Error(message);
      }

      const result: DiaryAnalysis = responseData.analysis;
      setAnalysis(result);

      // 🔽 ここから Supabase 保存処理 🔽
      // ログイン中のユーザーを取得
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        console.warn("ユーザー情報が取れなかったため、解析結果は保存しませんでした。", userError);
        return;
      }

      const userId = userData.user.id;

      const { error: insertError } = await supabase.from("diary_analysis").insert({
        diary_id: diaryId,
        user_id: userId,
        summary: result.summary ?? null,
        main_emotions: result.mainEmotions ?? null,
        key_themes: result.keyThemes ?? null,
        advice: result.advice ?? null,
        raw: result.raw ? result.raw : null,
      });

      if (insertError) {
        console.error("解析結果の保存に失敗しました:", insertError);
        // 画面上には出さず console に留めるならここまででもOK
      } else {
        console.log("解析結果を保存しました");
      }
      // 🔼 ここまで Supabase 保存処理 🔼

    } catch (e: any) {
      console.error(e);

      let message = e.message ?? "解析に失敗しました";
      if (message.includes("insufficient_quota") || message.includes("quota")) {
        message =
          "OpenAI API の利用上限（クォータ）を超えています。\n" +
          "OpenAI ダッシュボードの Billing / Usage を確認してみてください。";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50"
      >
        {loading ? "解析中..." : "AIに分析してもらう"}
      </button>

      {error && (
        <p className="text-sm text-red-500 whitespace-pre-wrap">{error}</p>
      )}

      {analysis && (
        <div className="rounded-lg border p-4 text-sm space-y-4">
          {analysis.summary && (
            <section>
              <h3 className="font-semibold mb-1">📝 要約</h3>
              <p>{analysis.summary}</p>
            </section>
          )}

          {analysis.mainEmotions && analysis.mainEmotions.length > 0 && (
            <section>
              <h3 className="font-semibold mb-1">💓 主な感情</h3>
              <p>{analysis.mainEmotions.join(" / ")}</p>
            </section>
          )}

          {analysis.keyThemes && analysis.keyThemes.length > 0 && (
            <section>
              <h3 className="font-semibold mb-1">🎯 キーとなるテーマ</h3>
              <p>{analysis.keyThemes.join(" / ")}</p>
            </section>
          )}

          {analysis.advice && (
            <section>
              <h3 className="font-semibold mb-1">✨ 次へのヒント</h3>
              <p>{analysis.advice}</p>
            </section>
          )}

          {analysis.raw && (
            <section>
              <h3 className="font-semibold mb-1">Raw</h3>
              <pre className="whitespace-pre-wrap text-xs">
                {analysis.raw}
              </pre>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
