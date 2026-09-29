import { NextResponse } from "next/server";
import {
  adjustBalance,
  getUserDetail,
  setUserBrowseable,
  setUserStatus,
  setUserVerification,
} from "@/lib/admin";
import { logAdminAction, requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const detail = getUserDetail(auth.db, id);
  if (!detail) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json(detail);
}

/** Body: { action: "suspend" | "activate" | "verify" | "unverify" | "browseable" | "adjustBalance", … } */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { db, admin } = auth;
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  const reason = String(body.reason || "").slice(0, 300);

  switch (action) {
    case "suspend":
    case "activate": {
      const suspend = action === "suspend";
      if (!setUserStatus(db, id, suspend, reason || null)) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
      logAdminAction(db, admin.id, suspend ? "user.suspend" : "user.activate", { type: "user", id }, reason);
      break;
    }
    case "verify":
    case "unverify": {
      const verified = action === "verify";
      if (!setUserVerification(db, id, verified)) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
      logAdminAction(db, admin.id, verified ? "user.verify" : "user.unverify", { type: "user", id }, reason);
      break;
    }
    case "browseable": {
      const on = Boolean(body.value);
      if (!setUserBrowseable(db, id, on)) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
      logAdminAction(db, admin.id, on ? "user.listInBrowse" : "user.hideFromBrowse", { type: "user", id });
      break;
    }
    case "adjustBalance": {
      const result = adjustBalance(db, id, Number(body.amount), reason);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      logAdminAction(
        db,
        admin.id,
        "user.adjustBalance",
        { type: "user", id },
        `${Number(body.amount) > 0 ? "+" : ""}${Number(body.amount)} · ${reason || "no note"}`
      );
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  return NextResponse.json(getUserDetail(db, id));
}
