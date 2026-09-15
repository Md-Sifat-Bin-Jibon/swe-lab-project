"use client";

import { useEffect, useState } from "react";
import { PageLoading } from "@/components/shared/PageLoading";
import { AppHeader } from "@/features/shared/AppHeader";
import { DashboardStats } from "@/features/dashboard/DashboardStats";
import { DashboardMatches } from "@/features/dashboard/DashboardMatches";
import { DashboardActivities } from "@/features/dashboard/DashboardActivities";
import { useSwapActions } from "@/features/swaps/SwapActionsProvider";
import { fetchDashboard, getCachedUser } from "@/services/api";
import type { DashboardPayload, MatchProfile } from "@/types";

function filterMatches(
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

export default function DashboardPage() {
  const { setOnMutate } = useSwapActions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [search, setSearch] = useState("");
  const [cached, setCached] = useState<ReturnType<typeof getCachedUser>>(null);

  useEffect(() => {
    setCached(getCachedUser());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load(initial = false) {
      if (initial) setLoading(true);
      setError(null);
      try {
        const payload = await fetchDashboard();
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setError("Failed to load the dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load(true);
    setOnMutate(() => load(false));
    return () => {
      cancelled = true;
      setOnMutate(null);
    };
  }, [setOnMutate]);

  if (loading && !data) {
    return <PageLoading title="Loading dashboard…" embedded />;
  }

  if (error && !data) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <p className="text-sm text-rose-600">{error}</p>
      </main>
    );
  }

  if (!data?.user) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <p className="text-sm text-rose-600">Could not load your account.</p>
      </main>
    );
  }

  const visibleMatches = filterMatches(data.allMatches, search);

  return (
    <>
      <AppHeader
        user={{
          avatar: data.user.avatar || cached?.avatar || "",
          firstName: data.user.firstName || cached?.firstName || "Member",
        }}
        searchPlaceholder={data.searchPlaceholder}
        unreadCount={data.unreadCount}
        searchValue={search}
        onSearchChange={(event) => setSearch(event.target.value)}
      />

      <main className="flex-1 space-y-8 overflow-auto p-6 lg:p-8">
        <DashboardStats user={data.user} stats={data.stats} />
        <DashboardMatches profiles={visibleMatches} />
        <DashboardActivities activities={data.activities} />
      </main>
    </>
  );
}
