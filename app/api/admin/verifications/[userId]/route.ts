import { NextResponse } from "next/server";
import { setUserVerification } from "@/lib/admin";
import { logAdminAction, requireAdmin } from "@/lib/adminAuth";
import { getVerificationStatus } from "@/lib/idVerification";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ userId: string }> };

/** Body: { action: "approve" | "reject", reason?: string } */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { db, admin } = auth;
  const { userId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const approve = body.action === "approve";
  const reason = String(body.reason || "").slice(0, 300);

  if (!setUserVerification(db, userId, approve)) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  logAdminAction(db, admin.id, approve ? "verification.approve" : "verification.reject", { type: "user", id: userId }, reason);

  return NextResponse.json({ verification: getVerificationStatus(db, userId) });
}
