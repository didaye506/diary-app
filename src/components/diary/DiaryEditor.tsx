// src/components/diary/DiaryEditor.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// 既存の書き味に合わせて "ここだけ" いまの page.tsx と同じ作りでOK
function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

function todayStr() {
  const d = new Date();
  return format(d, "yyyy-MM-dd");
}

function isValidDateStr(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toDateObj(dateStr: string) {
  // 表示用: "YYYY-MM-DD" -> Date
  // UTC/JSTズレを避けるために "T00:00:00" を付与
  return new Date(`${dateStr}T00:00:00`);
}

export default function DiaryEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const modeLabel = useMemo(() => (existingId ? "編集" : "新規"), [existingId]);

  // Popover のカレンダー表示用
  const selectedDateObj = useMemo(() => toDateObj(selectedDateStr), [selectedDateStr]);

  // ✅ 初回だけ ?date=YYYY-MM-DD を反映
  useEffect(() => {
    const qp = searchParams.get("date");
    if (qp && isValidDateStr(qp)) {
      setSelectedDateStr(qp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 日付変更でその日のデータをロード
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const sb = supabaseBrowser();
        const {
          data: { user },
          error: userError,
        } = await sb.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data, error } = await sb
          .from("diary_entries")
          .select("id,title,body")
          .eq("user_id", user.id)
          .eq("entry_date", selectedDateStr)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setExistingId(data.id);
          setTitle(data.title ?? "");
          setBody(data.body ?? "");
        } else {
          setExistingId(null);
          setTitle("");
          setBody("");
        }
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateStr]);

  const save = async () => {
    if (!body.trim()) return;

    setSaving(true);
    try {
      const sb = supabaseBrowser();
      const {
        data: { user },
        error: userError,
      } = await sb.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await sb
        .from("diary_entries")
        .upsert(
          {
            user_id: user.id,
            entry_date: selectedDateStr,
            title: title.trim() || null,
            body,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,entry_date" }
        )
        .select("id")
        .single();

      if (error) throw error;

      if (data?.id) {
        router.push(`/forest?new=${encodeURIComponent(String(data.id))}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full" style={{ background: "#070a0f" }}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-5 py-8">
        {/* 日付ピッカー（shadcn Calendar + Popover） */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white/90"
                >
                  {selectedDateStr}（{modeLabel}）
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDateObj}
                  onSelect={(d) => {
                    if (!d) return;
                    setSelectedDateStr(format(d, "yyyy-MM-dd"));
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-sm text-white/50">
              {loading ? "読み込み中…" : ""}
            </span>
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="（任意）"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 outline-none placeholder:text-white/25"
          disabled={loading}
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder=""
          className="min-h-[55dvh] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-[15px] leading-7 text-white/80 outline-none"
          disabled={loading}
        />

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => router.push("/forest")}
            className="rounded-full bg-white/6 px-4 py-2 text-sm text-white/60 hover:bg-white/10 disabled:opacity-50"
            disabled={saving}
          >
            戻る
          </button>

          <button
            onClick={save}
            className="rounded-full bg-white/14 px-4 py-2 text-sm text-white/75 hover:bg-white/18 disabled:opacity-50"
            disabled={saving || loading}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
