"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageLoading } from "@/components/shared/PageLoading";
import { AppHeader } from "@/features/shared/AppHeader";
import { BrowseFilters } from "@/features/browse/BrowseFilters";
import { MatchGrid } from "@/features/browse/MatchGrid";
import {
  activeFilterCount,
  applyFilters,
  buildOptions,
  EMPTY_FILTERS,
  filtersFromParams,
  filtersToQuery,
  type BrowseFilterState,
} from "@/features/browse/filterState";
import { fetchDashboard, fetchMatches, getCachedUser } from "@/services/api";
import type { MatchProfile, SessionUser } from "@/types";

export function BrowseView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cached, setCached] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shellUser, setShellUser] = useState<SessionUser | null>(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search matches…");
  const [unreadCount, setUnreadCount] = useState(0);
  const [profiles, setProfiles] = useState<MatchProfile[]>([]);
  const [filters, setFilters] = useState<BrowseFilterState>(() =>
    searchParams ? filtersFromParams(new URLSearchParams(searchParams.toString())) : EMPTY_FILTERS
  );

  useEffect(() => {
    setCached(getCachedUser());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [shell, matchData] = await Promise.all([fetchDashboard(), fetchMatches()]);
        if (cancelled) return;
        setShellUser(shell.user);
        setSearchPlaceholder(shell.searchPlaceholder);
        setUnreadCount(shell.unreadCount);
        setProfiles(matchData.matches);
      } catch {
        if (!cancelled) setError("Failed to load the browse page.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the URL in sync so filtered views survive refresh and can be shared.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = filtersToQuery(filters);
      const current = searchParams?.toString() ? `?${searchParams.toString()}` : "";
      if (next !== current) router.replace(`${pathname}${next}`, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [filters, pathname, router, searchParams]);

  const options = useMemo(() => buildOptions(profiles), [profiles]);
  const filtered = useMemo(() => applyFilters(profiles, filters), [profiles, filters]);
  const matches = useMemo(() => filtered.filter((p) => (p.matchScore ?? 0) >= 2), [filtered]);
  const others = useMemo(() => filtered.filter((p) => (p.matchScore ?? 0) < 2), [filtered]);

  const hasFilters = activeFilterCount(filters) > 0 || filters.q.trim() !== "";

  if (loading) return <PageLoading title="Finding matches…" embedded />;

  if (error && profiles.length === 0) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <p className="text-sm text-rose-600">{error}</p>
      </main>
    );
  }

  return (
    <>
      <AppHeader
        user={{
          avatar: shellUser?.avatar || cached?.avatar || "",
          firstName: shellUser?.firstName || cached?.firstName || "Member",
        }}
        searchPlaceholder={searchPlaceholder}
        unreadCount={unreadCount}
      />

      <main className="flex-1 space-y-8 overflow-auto p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Browse Swaps</h1>

        <BrowseFilters
          filters={filters}
          onChange={setFilters}
          options={options}
          mySkills={{ offer: shellUser?.skillsOffer ?? [], want: shellUser?.skillsWant ?? [] }}
        />

        {hasFilters ? (
          <p className="text-sm text-slate-500" aria-live="polite">
            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of {profiles.length} members
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <p className="text-lg font-semibold text-slate-900">No members match these filters</p>
            <p className="mt-1 text-sm text-slate-500">Try removing a filter or searching for something broader.</p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="mt-5 rounded-lg bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3f52c4]"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {matches.length ? (
              <MatchGrid title="Matches For You" titleId="browse-matches-heading" profiles={matches} />
            ) : null}
            {others.length ? (
              <MatchGrid
                title={matches.length ? "More Members" : "Members"}
                titleId="browse-others-heading"
                profiles={others}
              />
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
