"use client";

import { useEffect, useMemo, useState } from "react";
import { PageLoading } from "@/components/shared/PageLoading";
import { AppHeader } from "@/features/shared/AppHeader";
import { BrowseFilters } from "@/features/browse/BrowseFilters";
import { MatchGrid } from "@/features/browse/MatchGrid";
import {
  fetchDashboard,
  fetchMatches,
  getCachedUser,
} from "@/services/api";
import type { MatchProfile, SessionUser } from "@/types";

function filterProfiles(
  profiles: MatchProfile[],
  query: string
): MatchProfile[] {
  const q = query.trim().toLowerCase();
  if (!q) return profiles;
  return profiles.filter(
    (profile) =>
      profile.name.toLowerCase().includes(q) ||
      profile.offer.toLowerCase().includes(q) ||
      profile.want.toLowerCase().includes(q) ||
      profile.location.toLowerCase().includes(q)
  );
}

export default function BrowsePage() {
  const [cached, setCached] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shellUser, setShellUser] = useState<SessionUser | null>(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search matches…");
  const [unreadCount, setUnreadCount] = useState(0);
  const [profiles, setProfiles] = useState<MatchProfile[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setCached(getCachedUser());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [shell, matchData] = await Promise.all([
          fetchDashboard(),
          fetchMatches(),
        ]);
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

  const filtered = useMemo(
    () => filterProfiles(profiles, search),
    [profiles, search]
  );
  const featured = useMemo(
    () => filtered.filter((profile) => profile.available),
    [filtered]
  );

  if (loading) {
    return <PageLoading title="Finding matches…" embedded />;
  }

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
        <BrowseFilters searchValue={search} onSearchChange={setSearch} />
        <MatchGrid
          title="Matches For You"
          titleId="browse-matches-heading"
          profiles={filtered}
        />
        <MatchGrid
          title="Featured"
          titleId="browse-featured-heading"
          profiles={featured}
        />
      </main>
    </>
  );
}
