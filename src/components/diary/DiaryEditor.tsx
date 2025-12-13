"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}
function isValidDateStr(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function safeDateLabel(dateStr: string) {
  try {
    return format(new Date(`${dateStr}T00:00:00`), "yyyy/MM/dd");
  } catch {
    return dateStr;
  }
}

type LoadedEntry = {
  id: string;
  title: string | null;
  body: string;
};

type Draft = {
  title: string;
  body: string;
  savedAt: string; // ISO
};

export default function DiaryEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI補助
  const [draftInfo, setDraftInfo] = useState<string | null>(null); // "下書き保存: 12:34"
  const [lastSavedInfo, setLastSavedInfo] = useState<string | null>(null); // "最終保存: 12:34"
  const [elapsedSec, setElapsedSec] = useState(0);

  const startedAtRef = useRef<number>(Date.now());
  const initialRef = useRef({ title: "", body: "" }); // 未保存判定の基準
  const lastAutoSavedAtRef = useRef<number>(0);

  const modeLabel = existingId ? "編集" : "新規";
  const isDirty = title !== initialRef.current.title || body !== initialRef.current.body;

  // カウント
  const charCount = body.length;
  const wordCount = useMemo(() => {
    const s = body.trim();
    if (!s) return 0;
    // 英文なら単語、日本語なら“語”より文字が主になるので参考値
    return s.split(/\s+/).filter(Boolean).length;
  }, [body]);

  // draftキー：ユーザー×日付で分ける
  const draftKey = useMemo(() => {
    if (!userId) return null;
    return `draft:diary:${userId}:${selectedDate}`;
  }, [userId, selectedDate]);

  /* 初期日付（/write?date=YYYY-MM-DD） */
  useEffect(() => {
    const qp = searchParams.get("date");
    if (qp && isValidDateStr(qp)) setSelectedDate(qp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ユーザー取得（1回だけ） */
  useEffect(() => {
    const run = async () => {
      const sb = supabaseBrowser();
      const {
        data: { user },
      } = await sb.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
    };
    run();
  }, [router]);

  /* 経過時間タイマー */
  useEffect(() => {
    const t = setInterval(() => {
      const sec = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSec(sec);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* 未保存ガード（リロード・タブ閉じ） */
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  /* Ctrl+S / Cmd+S 保存 */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isSaveCombo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
      if (!isSaveCombo) return;

      e.preventDefault();
      if (saving || loading) return;
      if (!body.trim()) return;

      void save();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, loading, body, title, selectedDate, userId]);

  /* 日付変更：未保存なら確認してから切り替え */
  const changeDate = (next: string) => {
    if (next === selectedDate) return;
    if (isDirty) {
      const ok = confirm("未保存の内容があります。日付を切り替えますか？（下書きは自動保存されます）");
      if (!ok) return;
    }
    setSelectedDate(next);
  };

  /* 日付変更でロード（entry_dateで取得）＋ 下書き復元 */
  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      setDraftInfo(null);
      setLastSavedInfo(null);

      const sb = supabaseBrowser();

      // まずDBの当日分を読む（1日1記事前提）
      const { data, error } = await sb
        .from("diary_entries")
        .select("id,title,body")
        .eq("user_id", userId)
        .eq("entry_date", selectedDate)
        .maybeSingle();

      if (error) {
        setError("読み込みに失敗しました");
        setLoading(false);
        return;
      }

      let loadedTitle = "";
      let loadedBody = "";
      let loadedId: string | null = null;

      if (data) {
        const d = data as LoadedEntry;
        loadedId = d.id;
        loadedTitle = d.title ?? "";
        loadedBody = d.body ?? "";
        setExistingId(loadedId);
      } else {
        setExistingId(null);
      }

      // 下書き（localStorage）確認
      let draft: Draft | null = null;
      if (draftKey) {
        try {
          const raw = localStorage.getItem(draftKey);
          if (raw) draft = JSON.parse(raw) as Draft;
        } catch {
          // 破損してても無視
        }
      }

      // ルール：
      // - DBに記事がある → DBを優先。ただし下書きがDBより新しそうなら復元を提案
      // - DBにない → 下書きがあれば復元
      if (loadedId) {
        setTitle(loadedTitle);
        setBody(loadedBody);
        initialRef.current = { title: loadedTitle, body: loadedBody };
        startedAtRef.current = Date.now();

        if (draft && draft.body) {
          // draftが存在する場合は「復元しますか？」を出す（任意）
          const draftTime = new Date(draft.savedAt).getTime();
          // “DBより新しい”判定は厳密じゃないので「存在したら提案」でOK
          const useDraft = confirm(
            `この日付の下書きが見つかりました（${format(new Date(draftTime), "HH:mm")}）。復元しますか？`
          );
          if (useDraft) {
            setTitle(draft.title ?? "");
            setBody(draft.body ?? "");
            // 復元したら“未保存”扱いにしたいので initialRef はDBのまま
            setDraftInfo(`下書き復元: ${format(new Date(draftTime), "HH:mm")}`);
          }
        }
      } else {
        if (draft && (draft.title || draft.body)) {
          setTitle(draft.title ?? "");
          setBody(draft.body ?? "");
          initialRef.current = { title: "", body: "" };
          startedAtRef.current = Date.now();
          setDraftInfo(`下書き復元: ${format(new Date(draft.savedAt), "HH:mm")}`);
        } else {
          setTitle("");
          setBody("");
          initialRef.current = { title: "", body: "" };
          startedAtRef.current = Date.now();
        }
      }

      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedDate, draftKey]);

  /* 自動保存（localStorage）：500msデバウンス */
  useEffect(() => {
    if (loading) return;
    if (!draftKey) return;

    const now = Date.now();
    // 入力が続く間の書き込み頻度を抑える
    const minIntervalMs = 800;
    const canWrite = now - lastAutoSavedAtRef.current >= minIntervalMs;

    const t = setTimeout(() => {
      if (!isDirty) return;

      // canWrite で粗くレート制限
      if (!canWrite) return;

      const draft: Draft = {
        title,
        body,
        savedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
        lastAutoSavedAtRef.current = Date.now();
        setDraftInfo(`下書き保存: ${format(new Date(), "HH:mm")}`);
      } catch {
        // localStorage容量などで失敗したら黙ってスルー（UX優先）
      }
    }, 500);

    return () => clearTimeout(t);
  }, [title, body, isDirty, loading, draftKey]);

  const clearDraft = () => {
    if (!draftKey) return;
    try {
      localStorage.removeItem(draftKey);
      setDraftInfo(null);
    } catch {}
  };

  const save = async () => {
    if (!body.trim()) return;
    if (!userId) return;

    setSaving(true);
    setError(null);

    try {
      const sb = supabaseBrowser();

      const { data, error } = await sb
        .from("diary_entries")
        .upsert(
          {
            user_id: userId,
            entry_date: selectedDate,
            title: title.trim() || null,
            body,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,entry_date" }
        )
        .select("id")
        .single();

      if (error) throw error;

      // 保存成功 → 未保存判定をリセット + 下書き削除
      initialRef.current = { title, body };
      clearDraft();
      setLastSavedInfo(`最終保存: ${format(new Date(), "HH:mm")}`);

      // ✅ 仕様固定：保存後は必ず forest
      router.push(`/forest?new=${encodeURIComponent(String(data.id))}`);
    } catch (e: any) {
      console.error("SAVE ERROR", e);
      alert(
        typeof e === "object"
          ? JSON.stringify(e, null, 2)
          : String(e)
      );
      setError(e?.message ?? "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const onBack = () => {
    if (isDirty && !confirm("未保存の内容があります。戻りますか？（下書きは自動保存されます）")) return;
    router.push("/entries");
  };

  const elapsedLabel = useMemo(() => {
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    return `${m}m ${String(s).padStart(2, "0")}s`;
  }, [elapsedSec]);

  return (
    <div className="min-h-[100dvh] w-full bg-[#070a0f]">
      <div className="mx-auto w-full max-w-2xl px-5 py-8 flex flex-col gap-3">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="text-sm text-white/80">
              {safeDateLabel(selectedDate)} の日記（{modeLabel}）
              {loading ? " – 読み込み中" : ""}
            </div>
            <div className="text-xs text-white/45 flex flex-wrap gap-x-3 gap-y-1">
              <span>経過: {elapsedLabel}</span>
              <span>文字: {charCount}</span>
              <span>単語: {wordCount}</span>
              {draftInfo ? <span>{draftInfo}</span> : null}
              {lastSavedInfo ? <span>{lastSavedInfo}</span> : null}
              {isDirty && !loading ? <span className="text-white/55">未保存</span> : null}
            </div>
          </div>

          {/* 日付切り替え（最小：input date） */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => changeDate(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none"
            disabled={loading || saving}
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="（任意）"
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 outline-none placeholder:text-white/25"
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={loading}
          className="min-h-[55dvh] resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-[15px] leading-7 text-white/80 outline-none"
        />

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onBack}
            disabled={saving}
            className="rounded-full bg-white/6 px-4 py-2 text-sm text-white/60 hover:bg-white/10 disabled:opacity-50"
          >
            戻る
          </button>

          <button
            onClick={() => void save()}
            disabled={saving || loading || !body.trim()}
            className="rounded-full bg-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/25 disabled:opacity-40"
          >
            {saving ? "保存中…" : "保存（⌘S / Ctrl+S）"}
          </button>
        </div>

        {/* 開発中に便利：下書き消し */}
        {draftKey && (title || body) ? (
          <div className="flex justify-end">
            <button
              onClick={clearDraft}
              className="text-xs text-white/35 hover:text-white/55"
              disabled={loading || saving}
              type="button"
            >
              下書きを削除
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
