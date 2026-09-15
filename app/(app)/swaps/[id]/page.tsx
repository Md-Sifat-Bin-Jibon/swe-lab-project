"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageLoading } from "@/components/shared/PageLoading";
import { AppHeader } from "@/features/shared/AppHeader";
import { SwapDetail } from "@/features/swaps/SwapDetail";
import { SwapNotFound } from "@/features/swaps/SwapNotFound";
import { useSwapActions } from "@/features/swaps/SwapActionsProvider";
import {
  ApiError,
  fetchDashboard,
  fetchSwap,
  getCachedUser,
} from "@/services/api";
import type { SessionUser, Swap } from "@/types";

export default function SwapDetailsPage() {
  const params = useParams<{ id: string }>();
  const swapId = params.id;
  const { setOnMutate } = useSwapActions();
  const [cached, setCached] = useState<SessionUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [shellUser, setShellUser] = useState<SessionUser | null>(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search matches…");
  const [unreadCount, setUnreadCount] = useState(0);
  const [swap, setSwap] = useState<Swap | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCached(getCachedUser());
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const shell = await fetchDashboard();
      setShellUser(shell.user);
      setSearchPlaceholder(shell.searchPlaceholder);
      setUnreadCount(shell.unreadCount);

      if (!swapId) {
        setNotFound(true);
        setSwap(null);
        return;
      }

      try {
        const { swap: next } = await fetchSwap(swapId);
        setSwap(next);
        setNotFound(false);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          setSwap(null);
        } else {
          throw err;
        }
      }
    } catch {
      setError("Failed to load swap details.");
    } finally {
      setLoading(false);
    }
  }, [swapId]);

  useEffect(() => {
    void load();
    setOnMutate(load);
    return () => setOnMutate(null);
  }, [load, setOnMutate]);

  if (loading) {
    return <PageLoading title="Loading swap details…" embedded />;
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
        {notFound || !swap ? (
          <SwapNotFound swapId={swapId} />
        ) : (
          <SwapDetail swap={swap} />
        )}
      </main>
    </>
  );
}
