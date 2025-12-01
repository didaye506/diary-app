"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type DiaryEntry = {
  id: string;
  title: string;
  body: string;
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

export default function EntryDetailPage() {
  const pathname = usePathname(); // "/entries/<id>"
  const id = pathname.split("/").pop() ?? "";
  const router = useRouter();

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
        setEntry(data as DiaryEntry);
      }
      setLoading(false);
    };

    fetchEntry();
  }, [id]);

  const handleDelete = async () => {
    if (!entry) return;
    const ok = window.confirm("本当にこの日記を削除しますか？");
    if (!ok) return;

    setDeleting(true);

    const { error } = await supabase
      .from("diary_entries")
      .delete()
      .eq("id", entry.id);

    setDeleting(false);

    if (error) {
      alert("削除時にエラーが発生しました: " + error.message);
      return;
    }

    router.push("/entries");
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
        <p>読み込み中...</p>
      </main>
    );
  }

  if (error || !entry) {
    return (
      <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-4">読み込みエラー</h1>
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-sm text-gray-600 mb-2">id: {id}</p>
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
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <header className="mb-4 flex items-center justify-between gap-2">
        <Link
          href="/entries"
          className="text-sm text-blue-600 hover:underline"
        >
          ← 一覧に戻る
        </Link>

        <div className="flex gap-2">
          <Link href={`/entries/${entry.id}/edit`}>
            <Button variant="outline" size="sm">
              編集
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "削除中..." : "削除"}
          </Button>
        </div>
      </header>

      <h1 className="text-3xl font-bold mb-2">{entry.title}</h1>

      <div className="text-sm text-gray-500 mb-4">
        {new Date(entry.created_at).toLocaleString("ja-JP")} ／{" "}
        <span className="text-2xl">{moodToEmoji(entry.mood)}</span>
      </div>

      <article className="prose whitespace-pre-wrap">{entry.body}</article>
    </main>
  );
}
