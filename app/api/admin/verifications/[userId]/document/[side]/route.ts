import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { logAdminAction, requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ userId: string; side: string }> };

/**
 * Streams a stored ID document to a signed-in admin. The files live outside
 * public/, so this route is the only way to see them.
 */
export async function GET(request: Request, context: RouteContext) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { userId, side } = await context.params;
  if (side !== "front" && side !== "back") {
    return NextResponse.json({ error: "Invalid side." }, { status: 400 });
  }

  const row = auth.db
    .prepare("SELECT file_path, mime_type FROM id_documents WHERE user_id = ? AND side = ? ORDER BY id DESC LIMIT 1")
    .get(userId, side) as { file_path: string; mime_type: string } | undefined;
  if (!row) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  // Only ever read from the documents folder, whatever is stored in the row.
  const root = path.join(process.cwd(), "data", "id-documents");
  const full = path.resolve(process.cwd(), row.file_path);
  if (!full.startsWith(root)) return NextResponse.json({ error: "Document not available." }, { status: 404 });

  const file = await readFile(full).catch(() => null);
  if (!file) return NextResponse.json({ error: "Document file is missing." }, { status: 404 });

  logAdminAction(auth.db, auth.admin.id, "verification.viewDocument", { type: "user", id: userId }, side);

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": row.mime_type || "image/jpeg",
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${userId}-${side}"`,
    },
  });
}
