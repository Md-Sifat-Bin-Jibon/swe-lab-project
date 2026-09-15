import type { MatchProfile, SessionUser } from "@/types";

function normalizeSkill(skill: string): string {
  return String(skill || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function skillsAlign(a: string, b: string): boolean {
  const left = normalizeSkill(a);
  const right = normalizeSkill(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function matchScore(
  profile: MatchProfile,
  user: Pick<SessionUser, "skillsOffer" | "skillsWant"> | null
): number {
  const offers = user?.skillsOffer ?? [];
  const wants = user?.skillsWant ?? [];
  let score = 0;

  if (offers.some((skill) => skillsAlign(skill, profile.want))) score += 2;
  if (wants.some((skill) => skillsAlign(skill, profile.offer))) score += 2;
  if (profile.available) score += 1;

  return score;
}

export function rankProfiles(
  profiles: MatchProfile[],
  user: Pick<SessionUser, "skillsOffer" | "skillsWant"> | null
): MatchProfile[] {
  const ranked = profiles
    .map((profile) => ({ profile, score: matchScore(profile, user) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Number(b.profile.available) - Number(a.profile.available);
    });

  const matched = ranked
    .filter((item) => item.score > 0)
    .map((item) => item.profile);

  if (matched.length) return matched;
  return profiles.filter((profile) => profile.available);
}
