// src/app/entries/new/page.tsx
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewEntryPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("😊");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const moodValue =
      mood === "😊" ? "good" : mood === "😐" ? "normal" : "bad";

    const { error } = await supabase.from("diary_entries").insert({
      title,
      body,
      mood: moodValue,
    });

    setIsSubmitting(false);

    if (error) {
      alert("保存時にエラーが発生しました: " + error.message);
      return;
    }

    router.push("/entries");
  };

  return (
    <main className="min-h-screen px-4 py-8 max-w-xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">新しい日記を書く</h1>
        <Link href="/entries" className="text-sm text-blue-600 hover:underline">
          日記一覧へ戻る
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">タイトル</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="今日一日をひと言で表すと？"
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
            placeholder="今日あったこと、感じたことを書いてみよう"
            className="min-h-[160px]"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4"
        >
          {isSubmitting ? "保存中..." : "この内容で保存"}
        </Button>
      </form>
    </main>
  );
}
