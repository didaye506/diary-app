// src/app/billing/page.tsx
"use client";

import { useState } from "react";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        console.error("Checkout error:", data);
        setError(data.error ?? "決済ページの作成に失敗しました。");
        setLoading(false);
        return;
      }

      // Stripe Checkout へリダイレクト
      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      setError("決済処理中にエラーが発生しました。");
      setLoading(false);
    }
  };

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
        <li>月額 200円</li>
        <li>AI解析機能やInsightsの利用</li>
        <li>今後の新機能を優先的に利用可能</li>
      </ul>

      {error && (
        <p className="text-xs text-red-600 whitespace-pre-wrap">{error}</p>
      )}

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="mt-2 inline-flex items-center justify-center rounded-md border border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
      >
        {loading ? "決済ページに移動中..." : "有料登録して応援する"}
      </button>
    </main>
  );
}
