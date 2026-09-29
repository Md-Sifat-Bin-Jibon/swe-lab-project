import { skillsAlign } from "@/lib/matches";
import type { MatchProfile } from "@/types";

export type StatusFilter = "all" | "available" | "verified" | "top-rated";

export type BrowseFilterState = {
  q: string;
  /** Skills I want → members who OFFER any of them. */
  want: string[];
  /** Skills I offer → members who WANT any of them. */
  offer: string[];
  location: string;
  status: StatusFilter;
};

export const EMPTY_FILTERS: BrowseFilterState = {
  q: "",
  want: [],
  offer: [],
  location: "",
  status: "all",
};

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All members" },
  { value: "available", label: "Available now" },
  { value: "verified", label: "Only verified (ID)" },
  { value: "top-rated", label: "Top rated (4.5+)" },
];

export function ratingValue(rating: string): number {
  const n = parseFloat(rating);
  return Number.isFinite(n) ? n : 0;
}

/** Number of reviews from a rating string like "4.8 (12)". */
export function reviewCount(rating: string): number {
  const m = /\((\d+)\)/.exec(rating || "");
  return m ? Number(m[1]) : 0;
}

export function offersOf(p: MatchProfile): string[] {
  return p.skills.length ? p.skills : p.offer ? [p.offer] : [];
}

export function wantsOf(p: MatchProfile): string[] {
  return p.wants?.length ? p.wants : p.want ? [p.want] : [];
}

function uniqueSorted(values: string[]): string[] {
  const map = new Map<string, string>();
  for (const v of values) {
    const t = v.trim();
    if (t && !map.has(t.toLowerCase())) map.set(t.toLowerCase(), t);
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b));
}

/** Dropdown options built from the members that actually exist. */
export function buildOptions(profiles: MatchProfile[]) {
  return {
    offeredSkills: uniqueSorted(profiles.flatMap(offersOf)),
    wantedSkills: uniqueSorted(profiles.flatMap(wantsOf)),
    locations: uniqueSorted(profiles.map((p) => p.location)),
  };
}

export function activeFilterCount(f: BrowseFilterState): number {
  return (
    (f.want.length ? 1 : 0) +
    (f.offer.length ? 1 : 0) +
    (f.location ? 1 : 0) +
    (f.status !== "all" ? 1 : 0)
  );
}

export function applyFilters(profiles: MatchProfile[], f: BrowseFilterState): MatchProfile[] {
  const q = f.q.trim().toLowerCase();

  return profiles.filter((p) => {
    if (q) {
      const haystack = [p.name, p.location, p.bio, ...offersOf(p), ...wantsOf(p)]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (f.want.length && !f.want.some((s) => offersOf(p).some((o) => skillsAlign(s, o)))) {
      return false;
    }
    if (f.offer.length && !f.offer.some((s) => wantsOf(p).some((w) => skillsAlign(s, w)))) {
      return false;
    }
    if (f.location && p.location.trim().toLowerCase() !== f.location.toLowerCase()) {
      return false;
    }
    switch (f.status) {
      case "available":
        return p.available;
      case "verified":
        return Boolean(p.idVerified);
      case "top-rated":
        // New accounts start at a default 4.5 with 0 reviews — not "top rated" yet.
        return ratingValue(p.rating) >= 4.5 && reviewCount(p.rating) > 0;
      default:
        return true;
    }
  });
}

// --- URL <-> state (so filtered views can be shared / survive refresh) ---

export function filtersFromParams(params: URLSearchParams): BrowseFilterState {
  const list = (key: string) =>
    params
      .getAll(key)
      .flatMap((v) => v.split(","))
      .map((v) => v.trim())
      .filter(Boolean);
  const status = params.get("status") as StatusFilter | null;
  return {
    q: params.get("q") || "",
    want: list("want"),
    offer: list("offer"),
    location: params.get("location") || "",
    status: STATUS_OPTIONS.some((o) => o.value === status) ? status! : "all",
  };
}

export function filtersToQuery(f: BrowseFilterState): string {
  const params = new URLSearchParams();
  if (f.q.trim()) params.set("q", f.q.trim());
  if (f.want.length) params.set("want", f.want.join(","));
  if (f.offer.length) params.set("offer", f.offer.join(","));
  if (f.location) params.set("location", f.location);
  if (f.status !== "all") params.set("status", f.status);
  const s = params.toString();
  return s ? `?${s}` : "";
}
