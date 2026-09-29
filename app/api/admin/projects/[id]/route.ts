import { NextResponse } from "next/server";
import { logAdminAction, requireAdmin } from "@/lib/adminAuth";
import { deleteUploadedImage } from "@/lib/imageUpload";
import { deleteProject, getProject } from "@/lib/projects";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** Moderation: remove a project and its images. */
export async function DELETE(request: Request, context: RouteContext) {
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const project = getProject(auth.db, id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const reason = new URL(request.url).searchParams.get("reason") ?? "";
  deleteProject(auth.db, id);
  await Promise.all(project.images.map((u) => deleteUploadedImage(u, "projects")));
  logAdminAction(auth.db, auth.admin.id, "project.delete", { type: "project", id }, `${project.title} · ${reason}`);

  return NextResponse.json({ ok: true });
}
