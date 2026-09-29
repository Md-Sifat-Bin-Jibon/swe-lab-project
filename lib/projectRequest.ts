import { saveImage } from "@/lib/imageUpload";
import { cleanProjectInput, PROJECT_LIMITS, type ProjectInput } from "@/lib/projects";

/**
 * Reads a project multipart form.
 * - text fields: title, description, skill, tags (JSON array), projectUrl, duration, completedOn
 * - files: images (0..n)
 * - order (JSON array): final image order using existing URLs and "new:<index>" placeholders.
 *   If omitted: existing (in `keep` order) then new uploads.
 */
export async function readProjectForm(
  request: Request,
  existingImages: string[] = []
): Promise<{ input: ProjectInput; images: string[]; uploaded: string[] } | { error: string }> {
  const form = await request.formData().catch(() => null);
  if (!form) return { error: "Invalid form data." };

  const fields: Record<string, unknown> = {};
  for (const key of ["title", "description", "skill", "tags", "projectUrl", "duration", "completedOn"]) {
    fields[key] = form.get(key) ?? "";
  }
  const input = cleanProjectInput(fields);
  if ("error" in input) return input;

  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);

  let order: string[] = [];
  const rawOrder = form.get("order");
  if (typeof rawOrder === "string" && rawOrder) {
    try {
      const parsed = JSON.parse(rawOrder);
      if (Array.isArray(parsed)) order = parsed.map(String);
    } catch {
      return { error: "Invalid image order." };
    }
  } else {
    order = [...existingImages, ...files.map((_, i) => `new:${i}`)];
  }

  // Only allow existing images that really belong to this project.
  order = order.filter((item) => item.startsWith("new:") || existingImages.includes(item));
  if (order.length > PROJECT_LIMITS.images) {
    return { error: `A project can have up to ${PROJECT_LIMITS.images} images.` };
  }

  const uploaded: string[] = [];
  const newUrls = new Map<number, string>();
  for (const item of order) {
    if (!item.startsWith("new:")) continue;
    const index = Number(item.slice(4));
    const file = files[index];
    if (!file || newUrls.has(index)) continue;
    const saved = await saveImage(file, "projects");
    if ("error" in saved) return { error: saved.error };
    newUrls.set(index, saved.url);
    uploaded.push(saved.url);
  }

  const images = order
    .map((item) => (item.startsWith("new:") ? newUrls.get(Number(item.slice(4))) : item))
    .filter((u): u is string => Boolean(u));

  return { input, images, uploaded };
}
