import { NextResponse } from "next/server";
import { adminCancelProposal, adminResolveDispute, getSwapDetail } from "@/lib/admin";
import { logAdminAction, requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const detail = getSwapDetail(auth.db, id);
  if (!detail) return NextResponse.json({ error: "Swap not found." }, { status: 404 });
  return NextResponse.json(detail);
}

/** Body: { action: "cancel" | "resolveDispute", outcome?: "refund" | "release", note?: string } */
export async function POST(request: Request, context: RouteContext) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { db, admin } = auth;
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const note = String(body.note || "").slice(0, 300);

  if (body.action === "cancel") {
    const result = adminCancelProposal(db, id);
    if (!result.ok) return NextResponse.json({ error: "Pending proposal not found." }, { status: 404 });
    logAdminAction(db, admin.id, "swap.cancelProposal", { type: "swap", id }, `refunded $${result.refunded} · ${note}`);
    return NextResponse.json({ ok: true, refunded: result.refunded });
  }

  if (body.action === "resolveDispute") {
    const outcome = body.outcome === "refund" ? "refund" : "release";
    const result = adminResolveDispute(db, id, outcome, note);
    if (!result.ok) return NextResponse.json({ error: "Active swap not found." }, { status: 404 });
    logAdminAction(db, admin.id, `swap.dispute.${outcome}`, { type: "swap", id }, note);
    return NextResponse.json({ ...result, swap: getSwapDetail(db, id) });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
