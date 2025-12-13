// src/app/write/page.tsx
import { Suspense } from "react";
import DiaryEditor from "@/components/diary/DiaryEditor";

export default function WritePage() {
  return (
    <Suspense fallback={<WriteLoading />}>
      <DiaryEditor />
    </Suspense>
  );
}

function WriteLoading() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#070a0f] flex items-center justify-center">
      <p className="text-sm text-white/50">読み込み中...</p>
    </div>
  );
}
