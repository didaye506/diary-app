// src/components/AppHeader.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function AppHeader() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      // ログアウト後はトップに戻す（/login があるならそっちでもOK）
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="w-full border-b bg-white">
      <nav className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/entries" className="font-semibold text-lg">
            日記一覧
          </Link>

          <Link
            href="/insights"
            className="text-sm text-blue-600 hover:underline"
          >
            Insights
          </Link>

          <Link
            href="/billing"
            className="text-sm text-blue-600 hover:underline"
          >
            有料プラン
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs text-gray-600 hover:underline disabled:opacity-50"
          disabled={loggingOut}
        >
          {loggingOut ? "ログアウト中..." : "ログアウト"}
        </button>
      </nav>
    </header>
  );
}
