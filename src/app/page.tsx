// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">日記アプリ（仮）</h1>
        <p className="text-gray-600">
          Next.js + TypeScript の環境構築、完了しました 🎉
        </p>

        <Link
          href="/entries"
          className="inline-block mt-4 px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
        >
          日記一覧へ
        </Link>
      </div>
    </main>
  );
}
