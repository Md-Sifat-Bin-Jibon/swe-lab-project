import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { proposeSwap } from "@/lib/swaps";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const partnerId = String(body.partnerId || "").trim();
  const partnerName = String(body.partnerName || "").trim();
  const offering = String(body.offering || "").trim();
  const exchange = String(body.exchange || "").trim();
  const description =
    body.description !== undefined ? String(body.description) : undefined;
  const deadline =
    body.deadline !== undefined && body.deadline !== null && body.deadline !== ""
      ? String(body.deadline).trim()
      : undefined;
  const depositRaw = body.deposit;
  const deposit =
    depositRaw === undefined || depositRaw === null || depositRaw === ""
      ? undefined
      : Number(depositRaw);

  if (!partnerId || !offering || !exchange) {
    return NextResponse.json(
      { error: "partnerId, offering, and exchange are required." },
      { status: 400 }
    );
  }

  if (deposit !== undefined && (!Number.isFinite(deposit) || deposit < 0)) {
    return NextResponse.json(
      { error: "Deposit must be a non-negative number." },
      { status: 400 }
    );
  }

  const db = getDb();
  const result = proposeSwap(db, auth.userId, {
    partnerId,
    partnerName,
    offering,
    exchange,
    description,
    deadline,
    deposit,
  });

  if (!result.ok) {
    if (result.reason === "insufficient_balance") {
      return NextResponse.json(
        {
          error: `Deposit ($${result.deposit}) exceeds your available balance ($${result.balance}).`,
          reason: "insufficient_balance",
          balance: result.balance,
          deposit: result.deposit,
        },
        { status: 400 }
      );
    }
    if (result.reason === "duplicate") {
      return NextResponse.json(
        {
          error: "A proposal with this partner already exists.",
          reason: "duplicate",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Partner not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { ok: true, proposal: result.proposal },
    { status: 201 }
  );
}
