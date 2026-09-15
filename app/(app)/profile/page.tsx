"use client";

import { useEffect, useState } from "react";
import { PageLoading } from "@/components/shared/PageLoading";
import { AppHeader } from "@/features/shared/AppHeader";
import { OwnProfile } from "@/features/profile/OwnProfile";
import {
  fetchCurrentUser,
  fetchDashboard,
  getCachedUser,
} from "@/services/api";
import type { SessionUser } from "@/types";

export default function MyProfilePage() {
  const [cached, setCached] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search matches…");
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCached(getCachedUser());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [shell, me] = await Promise.all([
          fetchDashboard(),
          fetchCurrentUser(),
        ]);
        if (cancelled) return;
        setUser(me);
        setSearchPlaceholder(shell.searchPlaceholder);
        setUnreadCount(shell.unreadCount);
      } catch {
        if (!cancelled) setError("Failed to load your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <PageLoading title="Loading your profile…" embedded />;
  }

  if (error || !user) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <p className="text-sm text-rose-600">
          {error || "Could not load your profile."}
        </p>
      </main>
    );
  }

  return (
    <>
      <AppHeader
        user={{
          avatar: user.avatar || cached?.avatar || "",
          firstName: user.firstName || cached?.firstName || "Member",
        }}
        searchPlaceholder={searchPlaceholder}
        unreadCount={unreadCount}
      />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <OwnProfile user={user} onUpdated={setUser} />
      </main>
    </>
  );
}
