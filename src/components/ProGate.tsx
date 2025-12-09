// src/components/ProGate.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { isProPlan } from "@/lib/plan";
import { BETA_REQUIRE_PRO } from "@/lib/beta";

type ProGateProps = {
  children: ReactNode;
};

export function ProGate({ children }: ProGateProps) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkPro = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.warn("Failed to get user:", userError);
          setAllowed(false);
          setLoading(false);
          return;
        }

        if (!user) {
          setAllowed(false);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("plan, is_active")
          .eq("user_id", user.id)
          // 行が0件でもエラーにならない
          .maybeSingle();

        if (error) {
          console.warn("Failed to fetch profile:", error);
        }

        // プロフィール行がまだ無い場合は、β版中は Pro 扱いにしておく
        const plan = (data as any)?.plan ?? "pro";
        const is_active = (data as any)?.is_active ?? true;

        const pro = isProPlan(plan, is_active);

        if (BETA_REQUIRE_PRO) {
          setAllowed(pro);
        } else {
          // フリーミアム化したらここでページポリシーに応じて変える
          setAllowed(pro);
        }
      } catch (e) {
        console.warn("Unexpected error in ProGate:", e);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkPro();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-600">権限を確認しています...</p>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-bold">クローズドβ版のご案内</h1>
          <p className="text-sm text-gray-700 leading-relaxed">
            現在このアプリは、応援してくれている
            <span className="font-semibold">有料プランのユーザーのみ</span>
            が利用できるクローズドβ版として運用しています。
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            ご利用を希望される方は、
            <span className="font-semibold">有料登録</span>
            していただけると嬉しいです。
          </p>

          <Link
            href="/billing"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            有料登録して応援する →
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
