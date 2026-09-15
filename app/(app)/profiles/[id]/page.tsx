"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageLoading } from "@/components/shared/PageLoading";
import { AppHeader } from "@/features/shared/AppHeader";
import { ProfileDetail } from "@/features/profile/ProfileDetail";
import { ProfileNotFound } from "@/features/profile/ProfileNotFound";
import {
  ApiError,
  fetchDashboard,
  fetchProfile,
  getCachedUser,
} from "@/services/api";
import type { MatchProfile, SessionUser } from "@/types";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const profileId = params.id;
  const [cached, setCached] = useState<SessionUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [shellUser, setShellUser] = useState<SessionUser | null>(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search matches…");
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<MatchProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
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

        if (!profileId) {
          setNotFound(true);
          setProfile(null);
          return;
        }

        try {
          const { profile: next } = await fetchProfile(profileId);
          if (cancelled) return;
          setProfile(next);
          setNotFound(false);
        } catch (err) {
          if (cancelled) return;
          if (err instanceof ApiError && err.status === 404) {
            setNotFound(true);
            setProfile(null);
          } else {
            throw err;
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load the profile page.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (loading) {
    return <PageLoading title="Loading profile…" embedded />;
  }

  if (error && !shellUser) {
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

      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <p className="sr-only">
          {profile ? `${profile.name} — Profile` : "Profile not found"}
        </p>
        {notFound || !profile ? (
          <ProfileNotFound profileId={profileId} />
        ) : (
          <ProfileDetail profile={profile} />
        )}
      </main>
    </>
  );
}
