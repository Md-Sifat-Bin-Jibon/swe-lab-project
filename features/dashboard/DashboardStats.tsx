"use client";

import type { ReactNode } from "react";
import { StatCard } from "@/features/dashboard/StatCard";
import { useToast } from "@/hooks/useToast";
import type { SessionUser } from "@/types";

function formatStatValue(key: string, value: number): string {
  if (key === "balance") return `$${value}`;
  return String(value).padStart(2, "0");
}

const iconClass = "h-5 w-5";

function SwapsIcon() {
  return (
    <svg
      className={`${iconClass} text-emerald-600`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function ProposalsIcon() {
  return (
    <svg
      className={`${iconClass} text-orange-600`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="M12 22V12" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 12v10" />
    </svg>
  );
}

function MessagesIcon() {
  return (
    <svg
      className={`${iconClass} text-rose-600`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function BalanceIcon() {
  return (
    <svg
      className={`${iconClass} text-violet-600`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

interface StatConfig {
  key: "activeSwaps" | "proposals" | "newMessages" | "balance";
  icon: ReactNode;
  label: string;
  bgClass: string;
  href?: string;
  action?: "balance";
}

const statConfig: StatConfig[] = [
  {
    key: "activeSwaps",
    icon: <SwapsIcon />,
    label: "Active Swaps",
    bgClass: "bg-emerald-50",
    href: "/swaps",
  },
  {
    key: "proposals",
    icon: <ProposalsIcon />,
    label: "Proposals",
    bgClass: "bg-orange-50",
    href: "/swaps?tab=pending",
  },
  {
    key: "newMessages",
    icon: <MessagesIcon />,
    label: "New Message",
    bgClass: "bg-rose-50",
    href: "/chat",
  },
  {
    key: "balance",
    icon: <BalanceIcon />,
    label: "Balance",
    bgClass: "bg-violet-50",
    href: "/wallet",
  },
];

export interface DashboardStatsProps {
  user: Pick<SessionUser, "firstName" | "balance">;
  stats: {
    activeSwaps: number;
    proposals: number;
    newMessages: number;
    balance: number;
  };
}

export function DashboardStats({ user, stats }: DashboardStatsProps) {
  const { showToast } = useToast();

  return (
    <section aria-label="Statistics">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Hi {user.firstName}!
        </h1>
        <p className="mt-1 text-slate-500">Ready to swap skills?</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statConfig.map(({ key, icon, label, bgClass, href, action }) => (
          <StatCard
            key={key}
            icon={icon}
            value={formatStatValue(key, stats[key])}
            label={label}
            bgClass={bgClass}
            href={href}
            onClick={
              action === "balance"
                ? () =>
                    showToast(
                      `Your SwapSpot balance is $${user.balance ?? stats.balance}.`
                    )
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}
