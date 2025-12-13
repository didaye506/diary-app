import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

type ReqBody = { entryId: string };

// OpenAI: JSONで返させる（壊れたらエラーにする）
async function analyzeWithOpenAI(input: { body: string }) {
  const prompt = `
あなたは日記を分析するアシスタントです。
以下の日記本文から、指定のJSON形式だけを返してください。

# 出力JSONスキーマ（厳守）
{
  "summary": "100〜180文字",
  "main_emotions": ["感情1","感情2","感情3"] ,
  "key_themes": ["テーマ1","テーマ2","テーマ3"],
  "advice": "120〜220文字"
}

# ルール
- 文章は日本語
- 配列は最大3つ
- 文字数は目安。長すぎないように。

# 本文
${input.body}
`.trim();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error: ${res.status} ${text}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("OpenAI returned empty content");
  }

  // JSON部分だけをパース（余計な文章が混ざっても拾えるようにする）
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("OpenAI output is not JSON");

  const parsed = JSON.parse(match[0]);

  return {
    summary: String(parsed.summary ?? ""),
    main_emotions: Array.isArray(parsed.main_emotions) ? parsed.main_emotions.map(String).slice(0, 3) : [],
    key_themes: Array.isArray(parsed.key_themes) ? parsed.key_themes.map(String).slice(0, 3) : [],
    advice: String(parsed.advice ?? ""),
  };
}

export async function POST(req: Request) {
  try {
    const { entryId } = (await req.json()) as ReqBody;

    if (!entryId) {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 });
    }

    // ① 日記取得
    const { data: entry, error: fetchErr } = await supabase
      .from("diary_entries")
      .select("id,user_id,body")
      .eq("id", entryId)
      .single();

    if (fetchErr || !entry) {
      return NextResponse.json(
        { error: "entry not found", detail: fetchErr?.message ?? null },
        { status: 404 }
      );
    }

    const bodyText = String(entry.body ?? "").trim();
    if (!bodyText) {
      return NextResponse.json({ error: "body is empty" }, { status: 400 });
    }

    // ② OpenAI 解析
    const result = await analyzeWithOpenAI({ body: bodyText });

    // ③ diary_analysis に upsert
    const payload = {
      diary_id: entry.id,
      user_id: entry.user_id,
      summary: result.summary,
      main_emotions: result.main_emotions, // text[]
      key_themes: result.key_themes,       // text[]
      advice: result.advice,
    };

    const { data: upserted, error: upsertErr } = await supabase
      .from("diary_analysis")
      .upsert(payload, { onConflict: "diary_id" })
      .select("id, diary_id")
      .single();

    if (upsertErr) {
      console.error("UPSERT ERROR", {
        message: upsertErr.message,
        code: (upsertErr as any).code,
        details: (upsertErr as any).details,
        hint: (upsertErr as any).hint,
        payload,
      });
      return NextResponse.json(
        { error: upsertErr.message, code: (upsertErr as any).code ?? null },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      diaryId: entry.id,
      analysisId: upserted?.id ?? null,
    });
  } catch (e: any) {
    console.error("ANALYZE ERROR", e);
    return NextResponse.json(
      { error: e?.message ?? "internal error" },
      { status: 500 }
    );
  }
}
