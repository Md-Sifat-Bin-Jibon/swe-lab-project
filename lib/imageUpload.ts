import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/** Validated image uploads into public/uploads/<folder>/ (served as static files). */

const TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": {
    ext: "png",
    magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  "image/webp": {
    ext: "webp",
    magic: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  "image/gif": { ext: "gif", magic: (b) => b.subarray(0, 4).toString("ascii") === "GIF8" },
};

export async function saveImage(
  file: File,
  folder: string,
  maxBytes = 5 * 1024 * 1024
): Promise<{ url: string } | { error: string }> {
  const type = TYPES[(file.type || "").toLowerCase()];
  if (!type) return { error: `"${file.name}" must be a JPG, PNG, WebP or GIF image.` };
  if (file.size === 0) return { error: `"${file.name}" is empty.` };
  if (file.size > maxBytes) return { error: `"${file.name}" is larger than ${Math.round(maxBytes / 1024 / 1024)} MB.` };

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!type.magic(buffer)) return { error: `"${file.name}" isn't a valid image file.` };

  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "");
  const dir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${randomUUID()}.${type.ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return { url: `/uploads/${safeFolder}/${filename}` };
}

/** Deletes a file previously returned by saveImage (ignores anything else). */
export async function deleteUploadedImage(url: string, folder: string): Promise<void> {
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "");
  const prefix = `/uploads/${safeFolder}/`;
  if (!url.startsWith(prefix)) return;
  const name = path.basename(url);
  if (!/^[\w.-]+$/.test(name)) return;
  await unlink(path.join(process.cwd(), "public", "uploads", safeFolder, name)).catch(() => {});
}
