"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppHeader } from "@/features/shared/AppHeader";
import { fetchDashboard, getCachedUser } from "@/services/api";
import type { SessionUser } from "@/types";

/** Standard app page: header (avatar, unread count) + padded main area. */
export function AppPageFrame({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search matches…");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUser(getCachedUser());
    fetchDashboard()
      .then((shell) => {
        setUser(shell.user);
        setSearchPlaceholder(shell.searchPlaceholder);
        setUnreadCount(shell.unreadCount);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <AppHeader
        user={{ avatar: user?.avatar || "", firstName: user?.firstName || "Member" }}
        searchPlaceholder={searchPlaceholder}
        unreadCount={unreadCount}
      />
      <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
    </>
  );
}
