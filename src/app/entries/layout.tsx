// src/app/entries/layout.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EntriesLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // 未ログインならログイン画面へ
        router.replace("/login");
      } else {
        // ログイン済みなら children を表示
        setChecking(false);
      }
    };

    checkSession();
  }, [router]);

  // セッション確認中の間だけ表示
  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>認証確認中...</p>
      </main>
    );
  }

  return <>{children}</>;
}
