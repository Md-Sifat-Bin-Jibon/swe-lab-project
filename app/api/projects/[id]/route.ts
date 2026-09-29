import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { deleteUploadedImage } from "@/lib/imageUpload";
import { readProjectForm } from "@/lib/projectRequest";
import { deleteProject, getProject, updateProject } from "@/lib/projects";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

async function ownProject(request: Request, context: RouteContext) {
  const auth = requireUserId(request);
  if ("response" in auth) return { response: auth.response };
  const { id } = await context.params;
  const db = getDb();
  const project = getProject(db, id);
  if (!project || project.userId !== auth.userId) {
    return { response: NextResponse.json({ error: "Project not found." }, { status: 404 }) };
  }
  return { db, project };
}

/** Update a project (multipart form; `order` controls which images stay and their order). */
export async function PATCH(request: Request, context: RouteContext) {
  const owned = await ownProject(request, context);
  if ("response" in owned) return owned.response;
  const { db, project } = owned;

  const parsed = await readProjectForm(request, project.images);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const updated = updateProject(db, project.id, parsed.input, parsed.images);
  // Remove files for images that were dropped.
  const removed = project.images.filter((u) => !parsed.images.includes(u));
  await Promise.all(removed.map((u) => deleteUploadedImage(u, "projects")));

  return NextResponse.json({ project: updated });
}

export async function DELETE(request: Request, context: RouteContext) {
  const owned = await ownProject(request, context);
  if ("response" in owned) return owned.response;
  const { db, project } = owned;

  deleteProject(db, project.id);
  await Promise.all(project.images.map((u) => deleteUploadedImage(u, "projects")));
  return NextResponse.json({ ok: true });
}
