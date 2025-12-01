    // src/app/entries/[id]/edit/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DiaryEntry = {
  id: string;
  title: string;
  body: string;
  mood: string;
  created_at: string;
};

export default function EditEntryPage() {
  const pathname = usePathname(); // /entries/<id>/edit
  const parts = pathname.split("/");
  const id = parts.length >= 3 ? parts[2] : ""; // "entries", "<id>", "edit"
  const router = useRouter();

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("😊");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 既存データの読み込み
  useEffect(() => {
    const fetchEntry = async () => {
      if (!id) {
        setError("URL から id を取得できませんでした。");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError(error?.message ?? "データが見つかりませんでした。");
      } else {
        const e = data as DiaryEntry;
        setEntry(e);
        setTitle(e.title);
        setBody(e.body);
        setMood(
          e.mood === "good" ? "😊" : e.mood === "bad" ? "😢" : "😐"
        );
      }
      setLoading(false);
    };

    fetchEntry();
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    setSaving(true);

    const moodValue =
      mood === "😊" ? "good" : mood === "😐" ? "normal" : "bad";

    const { error } = await supabase
      .from("diary_entries")
      .update({
        title,
        body,
        mood: moodValue,
      })
      .eq("id", entry.id);

    setSaving(false);

    if (error) {
      alert("更新時にエラーが発生しました: " + error.message);
      return;
    }

    // 更新後、詳細ページへ戻る
    router.push(`/entries/${entry.id}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-8 max-w-xl mx-auto">
        <p>読み込み中...</p>
      </main>
    );
  }

  if (error || !entry) {
    return (
      <main className="min-h-screen px-4 py-8 max-w-xl mx-auto">
        <h1 className="text-xl font-bold mb-4">読み込みエラー</h1>
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          href="/entries"
          className="inline-block text-blue-600 underline"
        >
          一覧に戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">日記を編集</h1>
        <Link
          href={`/entries/${entry.id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          詳細に戻る
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">タイトル</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium">気分</label>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="😊">😊 いい感じ</option>
            <option value="😐">😐 ふつう</option>
            <option value="😢">😢 しんどめ</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium">本文</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[160px]"
            required
          />
        </div>

        <Button type="submit" disabled={saving} className="w-full mt-4">
          {saving ? "更新中..." : "この内容で更新"}
        </Button>
      </form>
    </main>
  );
}
