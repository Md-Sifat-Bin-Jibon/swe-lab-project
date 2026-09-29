import type { DatabaseSync } from "node:sqlite";
import {
  formatSessionUser,
  getUserSkillsByKind,
  type UserRow,
} from "@/lib/format";
import type { SessionUser } from "@/types";

export function loadSessionUser(
  db: DatabaseSync,
  userId: string
): SessionUser | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as
    | UserRow
    | undefined;
  if (!row) return null;

  const { skillsOffer, skillsWant } = readSkills(db, userId);
  return formatSessionUser(row, skillsOffer, skillsWant);
}

export function readSkills(
  db: DatabaseSync,
  userId: string
): { skillsOffer: string[]; skillsWant: string[] } {
  const { offer, want } = getUserSkillsByKind(db, userId);
  return { skillsOffer: offer, skillsWant: want };
}

function cleanList(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const skill = String(raw || "").trim().slice(0, 60);
    const key = skill.toLowerCase();
    if (skill && !seen.has(key)) {
      seen.add(key);
      out.push(skill);
    }
  }
  return out;
}

/**
 * Replaces the user's offered and/or wanted skills. Pass `undefined` for a
 * list to leave it untouched (e.g. onboarding step 3 only sends skillsWant).
 * users.offer_skill / users.want_skill mirror the first entry of each list,
 * since browse cards and matching read those "primary" skills.
 */
export function updateOfferWantSkills(
  db: DatabaseSync,
  userId: string,
  skillsOffer: string[] | undefined,
  skillsWant: string[] | undefined
): void {
  const replace = (kind: "offer" | "want", list: string[]) => {
    const skills = cleanList(list);
    db.prepare("DELETE FROM user_skills WHERE user_id = ? AND kind = ?").run(
      userId,
      kind
    );
    const insert = db.prepare(
      "INSERT INTO user_skills (user_id, skill, kind) VALUES (?, ?, ?)"
    );
    for (const skill of skills) insert.run(userId, skill, kind);

    const column = kind === "offer" ? "offer_skill" : "want_skill";
    db.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(
      skills[0] ?? null,
      userId
    );
  };

  if (Array.isArray(skillsOffer)) replace("offer", skillsOffer);
  if (Array.isArray(skillsWant)) replace("want", skillsWant);
}
