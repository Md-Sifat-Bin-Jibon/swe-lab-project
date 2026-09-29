import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { logActivity } from "@/lib/activity";
import type { VerificationStatus } from "@/types";

/**
 * ID documents are sensitive, so they are stored under data/ (git-ignored and
 * NOT inside public/), which means they are never served as static files.
 */
const DOCS_ROOT = path.join(process.cwd(), "data", "id-documents");

export const ID_MAX_BYTES = 8 * 1024 * 1024;
export const ID_MIN_BYTES = 20 * 1024;

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
};

export type ValidatedDoc = { buffer: Buffer; mime: string; ext: string };

/** Checks declared type, real file signature and size. Returns an error message or the file. */
export async function validateIdImage(
  file: File | null,
  label: string
): Promise<ValidatedDoc | { error: string }> {
  if (!file || file.size === 0) return { error: `Please upload the ${label}.` };

  const mime = (file.type || "").toLowerCase();
  const type = TYPES[mime];
  if (!type) return { error: `The ${label} must be a JPG, PNG or WebP image.` };
  if (file.size > ID_MAX_BYTES) return { error: `The ${label} must be under 8 MB.` };
  if (file.size < ID_MIN_BYTES) {
    return { error: `The ${label} looks too small. Please upload a clear, full-resolution photo.` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!type.magic(buffer)) return { error: `The ${label} doesn't look like a valid image file.` };

  return { buffer, mime, ext: type.ext };
}

export async function saveIdDocuments(
  db: DatabaseSync,
  userId: string,
  docs: { front: ValidatedDoc; back: ValidatedDoc }
): Promise<void> {
  const dir = path.join(DOCS_ROOT, userId.replace(/[^a-zA-Z0-9_-]/g, "_"));
  await mkdir(dir, { recursive: true });

  const insert = db.prepare(
    `INSERT INTO id_documents (user_id, side, file_path, mime_type, size_bytes)
     VALUES (?, ?, ?, ?, ?)`
  );

  // Replace any earlier submission.
  db.prepare("DELETE FROM id_documents WHERE user_id = ?").run(userId);

  for (const side of ["front", "back"] as const) {
    const doc = docs[side];
    const filename = `${side}-${Date.now()}-${randomUUID()}.${doc.ext}`;
    await writeFile(path.join(dir, filename), doc.buffer);
    insert.run(userId, side, path.relative(process.cwd(), path.join(dir, filename)), doc.mime, doc.buffer.length);
  }

  // Demo flow: documents that pass the checks above are approved immediately.
  // A real system would set 'pending' here and approve after a manual/KYC review.
  db.prepare(
    "UPDATE users SET id_verification_status = 'verified', id_verified_at = ? WHERE id = ?"
  ).run(new Date().toISOString(), userId);
  logActivity(db, { actorId: userId, kind: "id_verified" });
}

export function getVerificationStatus(db: DatabaseSync, userId: string): VerificationStatus | null {
  const user = db
    .prepare("SELECT id_verification_status, id_verified_at FROM users WHERE id = ?")
    .get(userId) as { id_verification_status: string | null; id_verified_at: string | null } | undefined;
  if (!user) return null;

  const docs = db
    .prepare("SELECT side, uploaded_at, size_bytes FROM id_documents WHERE user_id = ? ORDER BY side DESC")
    .all(userId) as { side: "front" | "back"; uploaded_at: string; size_bytes: number }[];

  return {
    status: user.id_verification_status === "verified" ? "verified" : "none",
    verifiedAt: user.id_verified_at,
    documents: docs.map((d) => ({ side: d.side, uploadedAt: d.uploaded_at, sizeBytes: d.size_bytes })),
  };
}
