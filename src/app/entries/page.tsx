"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";

import { Calendar, CalendarDayButton } from "@/components/ui/calendar";

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

type EntrySummary = {
  id: string;
  entry_date: string; // YYYY-MM-DD
  mood: string | null;
};

const moodToEmoji = (mood?: string | null) => {
  switch (mood) {
    case "good":
      return "😊";
    case "bad":
      return "😢";
    case "normal":
      return "😐";
    default:
      return "•";
  }
};

export default function EntriesPage() {
  const router = useRouter();
  const [month, setMonth] = useState<Date>(new Date());
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [loading, setLoading] = useState(true);

  // YYYY-MM-DD -> entry
  const entryMap = useMemo(() => {
    const map = new Map<string, EntrySummary>();
    entries.forEach((e) => map.set(e.entry_date, e));
    return map;
  }, [entries]);

  // 🔴 entryMap の中身確認
  console.log(
    "[entries] entryMap keys",
    Array.from(entryMap.keys())
  );

  useEffect(() => {
    const load = async () => {
      // 🔴 month state 確認
      console.log("[entries] month state", month);

      setLoading(true);
      const sb = supabaseBrowser();

      const {
        data: { user },
      } = await sb.auth.getUser();

      if (!user) {
        console.log("[entries] no user");
        setLoading(false);
        return;
      }

      // 表示中の月の範囲
      const from = format(
        new Date(month.getFullYear(), month.getMonth(), 1),
        "yyyy-MM-dd"
      );
      const to = format(
        new Date(month.getFullYear(), month.getMonth() + 1, 0),
        "yyyy-MM-dd"
      );

      // 🔴 取得範囲確認
      console.log("[entries] computed range", { from, to });

      const { data, error } = await sb
        .from("diary_entries")
        .select("id, entry_date, mood")
        .eq("user_id", user.id)
        .gte("entry_date", from)
        .lte("entry_date", to);

      // 🔴 Supabase 取得結果確認
      console.log("[entries] fetch range", { from, to });
      console.log("[entries] raw data", data);
      console.log("[entries] count", data?.length);
      if (error) {
        console.error("[entries] fetch error", error);
      }

      setEntries((data ?? []) as EntrySummary[]);
      setLoading(false);
    };

    load();
  }, [month]);

  return (
    <div className="min-h-[100dvh] w-full bg-[#090c11]">
      <div className="mx-auto w-full max-w-2xl px-5 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-medium text-white/80">日記</h1>
          <span className="text-xs text-white/40">
            {loading ? "読み込み中…" : ""}
          </span>
        </header>

        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          selected={undefined}
          onSelect={(date) => {
            if (!date) return;

            const dateStr = format(date, "yyyy-MM-dd");
            const entry = entryMap.get(dateStr);

            console.log("[entries] click date", dateStr, entry);

            if (entry) {
              router.push(`/entries/${entry.id}`);
            } else {
              router.push(`/write?date=${encodeURIComponent(dateStr)}`);
            }
          }}
          modifiers={{
            hasEntry: (date) =>
              entryMap.has(format(date, "yyyy-MM-dd")),
          }}
          modifiersClassNames={{
            hasEntry: "font-semibold",
          }}
          components={{
            DayButton: function EntryDayButton(props) {
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
    </div>
  );
}
