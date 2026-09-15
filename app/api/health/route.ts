import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export function GET() {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) AS count FROM users").get() as {
    count: number;
  };

  return NextResponse.json({ ok: true, users: row.count });
}
