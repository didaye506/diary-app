// src/components/UpgradeCta.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { isProPlan, type Plan } from "@/lib/plan";

type ProfileRow = {
  plan: Plan;
  is_active: boolean | null;
};

export function UpgradeCta() {
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);

      // 1. 認証ユーザー取得
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        // 未ログインなら「課金導線」を出しても意味薄いので何も出さない
        setIsPro(false);
        setLoading(false);
        return;
      }

      // 2. profiles から自分のプランを取得
      const { data, error } = await supabase
        .from("profiles")
        .select("plan, is_active")
        .eq("user_id", user.id)
        .single<ProfileRow>();

      if (error) {
        console.warn("failed to fetch profile plan:", error.message);
        setIsPro(false);
      } else {
        setIsPro(isProPlan(data?.plan, data?.is_active));
      }

      setLoading(false);
    };

    fetchPlan();
  }, []);

  // ローディング中 or Proユーザーの場合は何も表示しない
  if (loading || isPro) return null;

  // freeユーザーだけに見せる応援メッセージ + 課金導線
  return (
    <div className="mb-4 rounded-lg border bg-white p-4 text-sm space-y-2">
      <p className="font-semibold">🙏 このアプリを気に入ってくれた方へ</p>
      <p className="text-gray-700">
        日記のAI解析や開発を続けていくために、
        <span className="font-semibold">応援してくれる方は有料登録</span>
        をしてもらえるとうれしいです。
      </p>
      <div>
        {/* ここはあとで Stripe Checkout や /billing に差し替える */}
        <Link
          href="/billing"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
        >
          有料プランの案内を見る →
        </Link>
      </div>
    </div>
  );
}
