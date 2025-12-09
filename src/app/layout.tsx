// src/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";

export const metadata = {
  title: "AI日記アプリ",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50">
        {/* 共通ヘッダー（ログアウト付き） */}
        <AppHeader />

        {/* 各ページ側で <main> を使えるように div ラッパーのままにしておく */}
        <div className="max-w-3xl mx-auto px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
