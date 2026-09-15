import type { DatabaseSync } from "node:sqlite";
import {
  formatSessionUser,
  getUserSkills,
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

  const allSkills = getUserSkills(db, userId);
  const offerSkill = row.offer_skill;
  const wantSkill = row.want_skill;
  const skillsOfferList = offerSkill
    ? [
        offerSkill,
        ...allSkills.filter((s) => s !== offerSkill && s !== wantSkill),
      ]
    : allSkills.filter((s) => s !== wantSkill);
  const skillsWantList = wantSkill ? [wantSkill] : [];

  return formatSessionUser(row, skillsOfferList, skillsWantList);
}

export function readSkills(
  db: DatabaseSync,
  userId: string
): { skillsOffer: string[]; skillsWant: string[] } {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as
    | UserRow
    | undefined;
  if (!row) return { skillsOffer: [], skillsWant: [] };

  const allSkills = getUserSkills(db, userId);
  const skillsOffer = row.offer_skill
    ? [
        row.offer_skill,
        ...allSkills.filter(
          (s) => s !== row.offer_skill && s !== row.want_skill
        ),
      ]
    : allSkills.filter((s) => s !== row.want_skill);
  const skillsWant = row.want_skill ? [row.want_skill] : [];

  return { skillsOffer, skillsWant };
}

export function updateOfferWantSkills(
  db: DatabaseSync,
  userId: string,
  skillsOffer: string[] | undefined,
  skillsWant: string[] | undefined
): void {
  if (skillsOffer?.length) {
    db.prepare("UPDATE users SET offer_skill = ? WHERE id = ?").run(
      skillsOffer[0],
      userId
    );
  }

  if (skillsWant?.length) {
    db.prepare("UPDATE users SET want_skill = ? WHERE id = ?").run(
      skillsWant[0],
      userId
    );
  }

  db.prepare("DELETE FROM user_skills WHERE user_id = ?").run(userId);
  const insert = db.prepare(
    "INSERT INTO user_skills (user_id, skill) VALUES (?, ?)"
  );

  for (const skill of skillsOffer || []) {
    insert.run(userId, skill);
  }

  for (const skill of skillsWant || []) {
    if (!(skillsOffer || []).includes(skill)) {
      insert.run(userId, skill);
    }
  }
}
