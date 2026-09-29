import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { processDeposit } from "@/lib/wallet";

export const runtime = "nodejs";

/** DEMO deposit — validates the card like a gateway would, but never charges it. */
export async function POST(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));

  // Simulate the round-trip to a payment processor.
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const result = processDeposit(getDb(), auth.userId, {
    cardNumber: String(body.cardNumber || ""),
    cardName: String(body.cardName || ""),
    expMonth: Number(body.expMonth),
    expYear: Number(body.expYear),
    cvc: String(body.cvc || ""),
    amount: Number(body.amount),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, transaction: result.transaction ?? null },
      { status: result.transaction ? 402 : 400 }
    );
  }
  return NextResponse.json(result, { status: 201 });
}
