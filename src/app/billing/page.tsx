// src/app/billing/page.tsx
"use client";

import Link from "next/link";

export default function BillingPage() {
  return (
    <main className="min-h-screen max-w-md mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">有料プラン（応援プラン）のご案内</h1>

      <p className="text-sm text-gray-700 leading-relaxed">
        このアプリは個人開発で運営しており、
        開発継続や機能追加のための
        <span className="font-semibold">「応援プラン」</span>
        を用意しています。
      </p>

      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
        <li>月額 200円（予定）</li>
        <li>AI解析機能やInsightsの利用</li>
        <li>今後の新機能を優先的に利用可能</li>
      </ul>

      <p className="text-xs text-gray-500">
        現在、決済周りの準備中のため、
        実際の登録フローはもう少しだけお待ちください。
      </p>

      <Link
        href="/entries"
        className="inline-block text-sm text-blue-600 underline"
      >
        日記一覧に戻る
      </Link>
    </main>
  );
}
