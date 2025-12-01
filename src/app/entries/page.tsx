// src/app/entries/page.tsx
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

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

export default async function EntriesPage() {
  const { data, error } = await supabase
    .from("diary_entries")
    .select("id, title, body, mood, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">日記一覧</h1>
        <p className="text-red-600">Error: {error.message}</p>
      </main>
    );
  }

  const entries = (data ?? []) as DiaryEntry[];

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">日記一覧</h1>
        <Link href="/entries/new">
          <Button variant="outline" size="sm">
            新しい日記を書く
          </Button>
        </Link>
      </header>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">
          まだ日記がありません。最初の1件を書いてみましょう。
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Link key={entry.id} href={`/entries/${entry.id}`}>
              <Card className="hover:shadow-sm transition">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">
                      {entry.title}
                    </CardTitle>
                    <CardDescription>
                      {new Date(entry.created_at).toLocaleString("ja-JP")}
                    </CardDescription>
                  </div>
                  <div className="text-2xl">
                    {moodToEmoji(entry.mood)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {entry.body}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
