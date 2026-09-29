import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getWallet } from "@/lib/wallet";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const wallet = getWallet(getDb(), auth.userId);
  if (!wallet) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json(wallet);
}
