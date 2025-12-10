// src/app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  // 必要な環境変数をチェック
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!secretKey || !priceId || !appUrl) {
    console.error("Stripe env vars missing", {
      hasSecretKey: !!secretKey,
      hasPriceId: !!priceId,
      hasAppUrl: !!appUrl,
    });

    return NextResponse.json(
      { error: "Stripe is not configured on this environment." },
      { status: 500 }
    );
  }

  // ★ ここで初めて new Stripe する（＝ビルド時には実行されない）
  const stripe = new Stripe(secretKey);

  try {
    // 将来的にはここで userId を使って customer をひも付ける
    // const { userId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // 決済成功/キャンセル後に戻す先
      success_url: `${appUrl}/billing/success`,
      cancel_url: `${appUrl}/billing/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("create-checkout-session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
