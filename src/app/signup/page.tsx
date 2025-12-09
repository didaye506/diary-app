// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert("登録時にエラーが発生しました: " + error.message);
      return;
    }

    alert("仮登録しました。メールを確認してからログインしてください。");
    router.push("/login");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold">新規登録</h1>

        <div className="space-y-2">
          <label className="text-sm">メールアドレス</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">パスワード</label>
          <Input
            type="password"
            placeholder="8文字以上推奨"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button className="w-full" onClick={handleSignup} disabled={loading}>
          {loading ? "登録中..." : "登録する"}
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/login")}
        >
          すでにアカウントをお持ちの方はこちら
        </Button>
      </div>
    </main>
  );
}
