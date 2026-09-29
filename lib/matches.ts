import type { MatchProfile, SessionUser } from "@/types";

type Viewer = Pick<SessionUser, "skillsOffer" | "skillsWant"> | null;

export function normalizeSkill(skill: string): string {
  return String(skill || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function skillsAlign(a: string, b: string): boolean {
  const left = normalizeSkill(a);
  const right = normalizeSkill(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function offersOf(profile: MatchProfile): string[] {
  return profile.skills.length ? profile.skills : profile.offer ? [profile.offer] : [];
}

function wantsOf(profile: MatchProfile): string[] {
  return profile.wants?.length ? profile.wants : profile.want ? [profile.want] : [];
}

/**
 * +2 when they offer something you want, +2 when they want something you
 * offer (a two-way swap scores 4), +1 when they're available right now.
 */
export function matchScore(profile: MatchProfile, user: Viewer): number {
  const offers = user?.skillsOffer ?? [];
  const wants = user?.skillsWant ?? [];
  let score = 0;

  if (offers.some((mine) => wantsOf(profile).some((theirs) => skillsAlign(mine, theirs)))) score += 2;
  if (wants.some((mine) => offersOf(profile).some((theirs) => skillsAlign(mine, theirs)))) score += 2;
  if (profile.available) score += 1;

  return score;
}

/** Every profile, annotated with matchScore and sorted best-first. */
export function sortByMatch(profiles: MatchProfile[], user: Viewer): MatchProfile[] {
  return profiles
    .map((profile) => ({ ...profile, matchScore: matchScore(profile, user) }))
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (Number(b.available) !== Number(a.available)) {
        return Number(b.available) - Number(a.available);
      }
      return a.name.localeCompare(b.name);
    });
}

/** Dashboard shortlist: real matches, or available members if none match. */
export function rankProfiles(profiles: MatchProfile[], user: Viewer): MatchProfile[] {
  const ranked = sortByMatch(profiles, user);
  const matched = ranked.filter((p) => (p.matchScore ?? 0) > 1);
  if (matched.length) return matched;
  return ranked.filter((profile) => profile.available);
}
