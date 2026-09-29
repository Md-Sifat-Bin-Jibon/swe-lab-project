import type { Project } from "@/types";

const GRADIENTS = [
  "from-[#4a5fd9] to-[#7c3aed]",
  "from-[#0ea5e9] to-[#4a5fd9]",
  "from-[#f97316] to-[#e11d48]",
  "from-[#10b981] to-[#0ea5e9]",
  "from-[#a855f7] to-[#ec4899]",
  "from-[#334155] to-[#4a5fd9]",
];

/** Stable gradient for projects without images. */
export function gradientFor(project: Pick<Project, "id" | "title">): string {
  let h = 0;
  for (const c of project.id + project.title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

/** "2026-06" / "2026-06-14" → "Jun 2026". */
export function formatCompleted(value: string | null): string {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})/.exec(value);
  if (!m) return value;
  return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
