import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { deleteUploadedImage } from "@/lib/imageUpload";
import { readProjectForm } from "@/lib/projectRequest";
import { countProjects, createProject, listProjects, PROJECT_LIMITS } from "@/lib/projects";

export const runtime = "nodejs";

/** GET /api/projects?userId=… (defaults to the signed-in user). */
export async function GET(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const userId = new URL(request.url).searchParams.get("userId") || auth.userId;
  const db = getDb();
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  return NextResponse.json({ projects: listProjects(db, userId), limits: PROJECT_LIMITS });
}

/** Create a project (multipart form). */
export async function POST(request: Request) {
  const auth = requireUserId(request);
  if ("response" in auth) return auth.response;

  const db = getDb();
  if (countProjects(db, auth.userId) >= PROJECT_LIMITS.perUser) {
    return NextResponse.json(
      { error: `You can showcase up to ${PROJECT_LIMITS.perUser} projects. Remove one to add another.` },
      { status: 400 }
    );
  }

  const parsed = await readProjectForm(request);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const project = createProject(db, auth.userId, parsed.input, parsed.images);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    await Promise.all(parsed.uploaded.map((u) => deleteUploadedImage(u, "projects")));
    throw error;
  }
}
