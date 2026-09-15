import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

const ALLOWED: Record<string, { ext: string; kind: "image" | "voice" }> = {
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/png": { ext: "png", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "image/gif": { ext: "gif", kind: "image" },
  "audio/webm": { ext: "webm", kind: "voice" },
  "audio/ogg": { ext: "ogg", kind: "voice" },
  "audio/mpeg": { ext: "mp3", kind: "voice" },
  "audio/mp4": { ext: "m4a", kind: "voice" },
  "audio/wav": { ext: "wav", kind: "voice" },
  "audio/x-wav": { ext: "wav", kind: "voice" },
  "audio/x-m4a": { ext: "m4a", kind: "voice" },
};

function normalizeMime(raw: string): string {
  return raw.toLowerCase().split(";")[0]?.trim() || "";
}

function resolveUploadMeta(
  file: File
): { ext: string; kind: "image" | "voice" } | null {
  const mime = normalizeMime(file.type || "");
  if (mime && ALLOWED[mime]) return ALLOWED[mime];

  // Browsers often omit or use odd MIME for MediaRecorder blobs.
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".webm") || mime.includes("webm")) {
    return { ext: "webm", kind: "voice" };
  }
  if (name.endsWith(".ogg") || name.endsWith(".oga") || mime.includes("ogg")) {
    return { ext: "ogg", kind: "voice" };
  }
  if (name.endsWith(".mp3") || mime.includes("mpeg")) {
    return { ext: "mp3", kind: "voice" };
  }
  if (name.endsWith(".m4a") || name.endsWith(".mp4")) {
    return { ext: "m4a", kind: "voice" };
  }
  if (name.endsWith(".wav")) {
    return { ext: "wav", kind: "voice" };
  }
  if (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    mime === "image/jpg"
  ) {
    return { ext: "jpg", kind: "image" };
  }
  if (name.endsWith(".png")) return { ext: "png", kind: "image" };
  if (name.endsWith(".webp")) return { ext: "webp", kind: "image" };
  if (name.endsWith(".gif")) return { ext: "gif", kind: "image" };

  // Last resort for voice recordings with empty type.
  if (!mime && file.size > 0) {
    return { ext: "webm", kind: "voice" };
  }

  return null;
}

export type SavedChatUpload = {
  url: string;
  kind: "image" | "voice";
  mimeType: string;
};

export async function saveChatUpload(
  file: File
): Promise<SavedChatUpload | { error: string; status: number }> {
  const allowed = resolveUploadMeta(file);
  if (!allowed) {
    return {
      error: "Unsupported file type. Use an image or voice recording.",
      status: 400,
    };
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return { error: "File must be under 8MB.", status: 400 };
  }

  const dir = path.join(process.cwd(), "public", "uploads", "chat");
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID()}.${allowed.ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return {
    url: `/uploads/chat/${filename}`,
    kind: allowed.kind,
    mimeType: normalizeMime(file.type) || `audio/${allowed.ext}`,
  };
}
