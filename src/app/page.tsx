// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl font-bold">日記AI分析アプリ（β版）</h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          日記をAIが解析して、感情やテーマの傾向を可視化する個人開発アプリです。
          現在はクローズドβ版として、
          <span className="font-semibold">有料プランのユーザーのみ</span>
          に開放しています。
        </p>

        <div className="space-y-2">
          <Link
            href="/entries"
            className="inline-block px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
          >
            日記一覧へ
          </Link>

          <div className="text-xs text-gray-500">
            アプリ開発を応援してくれる方は、
            <Link
              href="/billing"
              className="underline text-blue-600 ml-1"
            >
              有料登録ページ
            </Link>
            から登録してもらえるとうれしいです。
          </div>
        </div>
      </div>
    </main>
  );
}
