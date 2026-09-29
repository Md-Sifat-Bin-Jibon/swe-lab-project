import { randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { Project } from "@/types";

export const PROJECT_LIMITS = {
  perUser: 12,
  images: 6,
  title: 80,
  description: 1500,
  tags: 8,
  tagLength: 30,
} as const;

type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  skill: string | null;
  tags: string;
  images: string;
  project_url: string | null;
  duration: string | null;
  completed_on: string | null;
  created_at: string;
  updated_at: string;
};

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    skill: row.skill,
    tags: parseList(row.tags),
    images: parseList(row.images),
    projectUrl: row.project_url,
    duration: row.duration,
    completedOn: row.completed_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listProjects(db: DatabaseSync, userId: string): Project[] {
  const rows = db
    .prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY COALESCE(completed_on, created_at) DESC, created_at DESC")
    .all(userId) as ProjectRow[];
  return rows.map(toProject);
}

export function getProject(db: DatabaseSync, id: string): Project | null {
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
  return row ? toProject(row) : null;
}

export type ProjectInput = {
  title: string;
  description: string;
  skill: string | null;
  tags: string[];
  projectUrl: string | null;
  duration: string | null;
  completedOn: string | null;
};

/** Validates + normalises user input. Returns an error message or clean data. */
export function cleanProjectInput(raw: Record<string, unknown>): ProjectInput | { error: string } {
  const title = String(raw.title ?? "").trim().replace(/\s+/g, " ");
  const description = String(raw.description ?? "").trim();
  if (!title) return { error: "Give your project a title." };
  if (title.length > PROJECT_LIMITS.title) return { error: `Keep the title under ${PROJECT_LIMITS.title} characters.` };
  if (description.length > PROJECT_LIMITS.description) {
    return { error: `Keep the description under ${PROJECT_LIMITS.description} characters.` };
  }

  let tags: string[] = [];
  const rawTags = raw.tags;
  if (Array.isArray(rawTags)) tags = rawTags.map(String);
  else if (typeof rawTags === "string" && rawTags.trim()) {
    try {
      const parsed = JSON.parse(rawTags);
      tags = Array.isArray(parsed) ? parsed.map(String) : rawTags.split(",");
    } catch {
      tags = rawTags.split(",");
    }
  }
  const seen = new Set<string>();
  tags = tags
    .map((t) => t.trim().replace(/\s+/g, " ").slice(0, PROJECT_LIMITS.tagLength))
    .filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()))
    .slice(0, PROJECT_LIMITS.tags);

  let projectUrl = String(raw.projectUrl ?? "").trim() || null;
  if (projectUrl) {
    if (!/^https?:\/\//i.test(projectUrl)) projectUrl = `https://${projectUrl}`;
    try {
      const u = new URL(projectUrl);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
      projectUrl = u.toString();
    } catch {
      return { error: "Enter a valid project link (https://…)." };
    }
  }

  const completedOn = String(raw.completedOn ?? "").trim() || null;
  if (completedOn && !/^\d{4}-\d{2}(-\d{2})?$/.test(completedOn)) return { error: "Invalid completion date." };

  const skill = String(raw.skill ?? "").trim().slice(0, 60) || null;
  const duration = String(raw.duration ?? "").trim().slice(0, 40) || null;

  return { title, description, skill, tags, projectUrl, duration, completedOn };
}

export function countProjects(db: DatabaseSync, userId: string): number {
  return (db.prepare("SELECT COUNT(*) AS c FROM projects WHERE user_id = ?").get(userId) as { c: number }).c;
}

export function createProject(db: DatabaseSync, userId: string, input: ProjectInput, images: string[]): Project {
  const id = `prj_${randomBytes(8).toString("hex")}`;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO projects (id, user_id, title, description, skill, tags, images, project_url, duration, completed_on, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    input.title,
    input.description,
    input.skill,
    JSON.stringify(input.tags),
    JSON.stringify(images),
    input.projectUrl,
    input.duration,
    input.completedOn,
    now,
    now
  );
  return getProject(db, id)!;
}

export function updateProject(db: DatabaseSync, id: string, input: ProjectInput, images: string[]): Project {
  db.prepare(
    `UPDATE projects SET title = ?, description = ?, skill = ?, tags = ?, images = ?, project_url = ?,
       duration = ?, completed_on = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    input.title,
    input.description,
    input.skill,
    JSON.stringify(input.tags),
    JSON.stringify(images),
    input.projectUrl,
    input.duration,
    input.completedOn,
    new Date().toISOString(),
    id
  );
  return getProject(db, id)!;
}

export function deleteProject(db: DatabaseSync, id: string): void {
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
}

/** Demo members get a couple of example projects so profiles don't look empty. */
export function seedSampleProjects(db: DatabaseSync): void {
  const samples: Record<string, Array<Omit<ProjectInput, "projectUrl"> & { projectUrl?: string | null }>> = {
    eric: [
      {
        title: "Brand identity for a specialty coffee roaster",
        description:
          "Logo, colour palette, packaging labels and a one-page brand guide for a small-batch roaster. Delivered a flexible logo system (primary, stacked and icon marks) and print-ready label templates.",
        skill: "Branding",
        tags: ["Logo", "Packaging", "Brand guide"],
        duration: "3 weeks",
        completedOn: "2026-06",
      },
      {
        title: "Illustrated poster series for a jazz festival",
        description: "Four-poster campaign with a shared illustration style, adapted for social media and street banners.",
        skill: "Illustration",
        tags: ["Poster", "Illustration", "Print"],
        duration: "2 weeks",
        completedOn: "2026-03",
      },
    ],
    neha: [
      {
        title: "Product photography for a handmade ceramics shop",
        description:
          "Studio and lifestyle shots for 40 products, colour-corrected and exported for web and Instagram. Includes a simple lighting setup guide the owner can reuse.",
        skill: "Photography",
        tags: ["Product", "E-commerce", "Lighting"],
        duration: "1 week",
        completedOn: "2026-07",
      },
      {
        title: "Portrait retouching workflow",
        description: "Built a Lightroom + Photoshop preset pack and batch workflow that cut editing time per portrait session in half.",
        skill: "Photo Editing",
        tags: ["Lightroom", "Retouching"],
        duration: "5 days",
        completedOn: "2026-02",
      },
    ],
    boston: [
      {
        title: "SEO relaunch for a local bakery website",
        description:
          "Keyword research, on-page fixes and a Google Business Profile refresh. Organic visits grew steadily over the following three months.",
        skill: "SEO",
        tags: ["SEO", "Local business", "Content"],
        duration: "1 month",
        completedOn: "2026-05",
      },
    ],
  };

  const exists = db.prepare("SELECT 1 FROM users WHERE id = ?");
  for (const [userId, projects] of Object.entries(samples)) {
    if (!exists.get(userId) || countProjects(db, userId) > 0) continue;
    for (const p of projects) createProject(db, userId, { projectUrl: null, ...p }, []);
  }
}
