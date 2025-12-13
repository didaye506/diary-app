"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { supabase } from "@/lib/supabaseClient";
import { ProGate } from "@/components/ProGate";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";

type DiaryEntry = {
  id: string;
  entry_date: string; // "YYYY-MM-DD"
  mood: string | null;
  title: string | null;
};

const moodToEmoji = (mood: string | null | undefined) => {
  switch (mood) {
    case "good":
      return "😊";
    case "bad":
      return "😢";
    default:
      return "😐";
  }
};

function monthRangeStr(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return {
    startStr: format(start, "yyyy-MM-dd"),
    endStr: format(end, "yyyy-MM-dd"),
  };
}

export default function EntriesPage() {
  const router = useRouter();

  // Calendar の月移動に使う
  const [month, setMonth] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  // entry_date -> entry のMap（クリック時に id を引く）
  const entryMap = useMemo(() => {
    const m = new Map<string, DiaryEntry>();
    for (const e of entries) m.set(e.entry_date, e);
    return m;
  }, [entries]);

  // 表示中の月のデータだけ取得
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const { startStr, endStr } = monthRangeStr(month);

      const { data, error } = await supabase
        .from("diary_entries")
        .select("id, entry_date, mood, title")
        .eq("user_id", user.id)
        .gte("entry_date", startStr)
        .lte("entry_date", endStr)
        .order("entry_date", { ascending: true });

      if (!error) setEntries((data ?? []) as DiaryEntry[]);
      setLoading(false);
    };

    load();
  }, [month]);

  return (
    <ProGate>
      <main className="min-h-screen max-w-3xl mx-auto px-4 py-8 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">日記カレンダー</h1>
            <p className="text-sm text-gray-500">
              日付をクリック：書いてあれば詳細へ / 無ければその日付で作成
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/write"
              className="text-sm px-3 py-2 border rounded-md hover:bg-gray-50"
            >
              書く
            </Link>
          </div>
        </header>

        {loading && <p>読み込み中...</p>}

        {!loading && (
          <div className="rounded-xl border p-3">
            <Calendar
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={undefined}
              onSelect={(date) => {
                if (!date) return;

                const dateStr = format(date, "yyyy-MM-dd");
                const entry = entryMap.get(dateStr);

                if (entry) router.push(`/entries/${entry.id}`);
                else router.push(`/write?date=${encodeURIComponent(dateStr)}`);
              }}
              modifiers={{
                hasEntry: (date) => entryMap.has(format(date, "yyyy-MM-dd")),
              }}
              modifiersClassNames={{
                hasEntry: "bg-gray-200 font-semibold",
              }}
              components={{
                DayButton: function EntryAwareDayButton(props) {
                  const dateStr = format(props.day.date, "yyyy-MM-dd");
                  const entry = entryMap.get(dateStr);

                  return (
                    <CalendarDayButton {...props} className="relative">
                      {props.children}
                      {entry && (
                        <span className="absolute bottom-1 right-1 text-[10px] leading-none">
                          {moodToEmoji(entry.mood)}
                        </span>
                      )}
                    </CalendarDayButton>
                  );
                },
              }}
            />
          </div>
        )}
      </main>
    </ProGate>
  );
}
