import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openaiClient";

export async function POST(req: NextRequest) {
  try {
    const { diaryText } = await req.json();

    if (!diaryText || typeof diaryText !== "string") {
      return NextResponse.json(
        { error: "diaryText is required" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      max_completion_tokens: 512,
      messages: [
        {
          role: "system",
          content:
            "あなたは日記の専門カウンセラーです。入力された日記を、JSON 形式で分析結果として返してください。" +
            "日本語で出力し、必ず次のキーを持つ JSON オブジェクトのみを返してください。" +
            `{
  "summary": "日記内容の要約（200文字以内）",
  "mainEmotions": ["主な感情を2〜4個の単語で列挙"],
  "keyThemes": ["出来事・テーマを2〜4個の単語で列挙"],
  "advice": "今後の行動や考え方のヒント（300文字以内）"
}`,
        },
        {
          role: "user",
          content: diaryText,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: "No content returned from OpenAI" },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // JSON としてパースできなかったときの一時フォールバック
      parsed = { raw: content };
    }

    return NextResponse.json(
      {
        analysis: parsed,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("analyze-diary error:", error);

    // 🔴 デバッグ用に詳細を返す（本番では消した方がいい）
    return NextResponse.json(
      {
        error: "Failed to analyze diary",
        detail: error?.message ?? null,
        status: error?.status ?? null,
        type: error?.name ?? null,
      },
      { status: 500 }
    );
  }
}
