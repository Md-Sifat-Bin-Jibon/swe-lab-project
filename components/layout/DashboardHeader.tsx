"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";

export interface DashboardHeaderUser {
  avatar: string;
  firstName: string;
}

export interface DashboardHeaderProps {
  user?: DashboardHeaderUser;
  searchPlaceholder?: string;
  unreadCount?: number;
  searchValue?: string;
  onSearchChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
  className?: string;
}

const DEFAULT_USER: DashboardHeaderUser = {
  avatar: "https://i.pravatar.cc/80?u=member",
  firstName: "Member",
};

export function DashboardHeader({
  user = DEFAULT_USER,
  searchPlaceholder = "Search matches…",
  unreadCount = 0,
  searchValue,
  onSearchChange,
  onNotificationsClick,
  onSettingsClick,
  onLogoutClick,
  className = "",
}: DashboardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const notificationLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <header
      className={`flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4 lg:px-8 ${className}`.trim()}
    >
      <div className="relative max-w-2xl flex-1">
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder={searchPlaceholder}
          aria-label="Search matches"
          value={searchValue}
          onChange={onSearchChange}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-swapspot-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
        />
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={notificationLabel}
          onClick={onNotificationsClick}
        >
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full transition hover:opacity-90"
            aria-label={`User menu for ${user.firstName}`}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Avatar
              src={user.avatar}
              name={user.firstName}
              alt={`${user.firstName}'s profile`}
              size={40}
              className="rounded-full ring-2 ring-slate-100"
            />
            <svg
              className="h-4 w-4 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="m6 9 6 6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            className={`absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg ${menuOpen ? "" : "hidden"}`}
            role="menu"
          >
            <Link
              href="/profile"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              My profile
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onSettingsClick?.();
              }}
            >
              Settings
            </button>
            <Link
              href="/browse"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              Browse skills
            </Link>
            <Link
              href="/swaps"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              Your swaps
            </Link>
            <hr className="my-1 border-slate-100" />
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onLogoutClick?.();
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
