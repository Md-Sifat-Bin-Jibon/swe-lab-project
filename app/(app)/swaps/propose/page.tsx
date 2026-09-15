"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageLoading } from "@/components/shared/PageLoading";
import { AppHeader } from "@/features/shared/AppHeader";
import { ProposeSwapForm } from "@/features/swaps/ProposeSwapForm";
import {
  ApiError,
  fetchDashboard,
  fetchProfile,
  getCachedUser,
} from "@/services/api";
import type { MatchProfile, SessionUser } from "@/types";

function ProposeSwapContent() {
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("partnerId") || "";

  const [cached, setCached] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [shellUser, setShellUser] = useState<SessionUser | null>(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search matches…");
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<MatchProfile | null>(null);
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
        const shell = await fetchDashboard();
        if (cancelled) return;
        setShellUser(shell.user);
        setSearchPlaceholder(shell.searchPlaceholder);
        setUnreadCount(shell.unreadCount);

        if (!partnerId) {
          setError("Choose a partner from Browse or their profile first.");
          setProfile(null);
          return;
        }

        const { profile: next } = await fetchProfile(partnerId);
        if (cancelled) return;
        setProfile(next);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setError("Partner profile not found.");
        } else {
          setError("Failed to load the propose swap page.");
        }
        setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [partnerId]);

  if (loading) {
    return <PageLoading title="Loading proposal form…" embedded />;
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
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        {error || !profile ? (
          <p className="text-sm text-rose-600">{error || "Partner not found."}</p>
        ) : (
          <ProposeSwapForm
            profile={profile}
            balance={shellUser?.balance ?? cached?.balance ?? 0}
          />
        )}
      </main>
    </>
  );
}

export default function ProposeSwapPage() {
  return (
    <Suspense fallback={<PageLoading title="Loading proposal form…" embedded />}>
      <ProposeSwapContent />
    </Suspense>
  );
}
