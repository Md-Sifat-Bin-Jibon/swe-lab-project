"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import {
  DashboardHeader,
  type DashboardHeaderUser,
} from "@/components/layout/DashboardHeader";
import { clearSession, logout } from "@/services/api";
import { useAppShell } from "@/features/shared/AppShellContext";

export interface AppHeaderProps {
  user?: DashboardHeaderUser;
  searchPlaceholder?: string;
  unreadCount?: number;
  searchValue?: string;
  onSearchChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function AppHeader({
  user,
  searchPlaceholder,
  unreadCount,
  searchValue,
  onSearchChange,
  className,
}: AppHeaderProps) {
  const router = useRouter();
  const { openSettings } = useAppShell();

  return (
    <DashboardHeader
      user={user}
      searchPlaceholder={searchPlaceholder}
      unreadCount={unreadCount}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      className={className}
      onNotificationsClick={() => router.push("/chat")}
      onSettingsClick={openSettings}
      onLogoutClick={async () => {
        try {
          await logout();
        } catch {
          clearSession();
        }
        router.push("/login");
      }}
    />
  );
}
