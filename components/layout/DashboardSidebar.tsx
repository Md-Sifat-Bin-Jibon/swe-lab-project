import Link from "next/link";
import type { ReactNode } from "react";

export type DashboardNavKey = "home" | "swaps" | "browse" | "chat" | "profile";

export interface DashboardSidebarProps {
  active?: DashboardNavKey;
  className?: string;
  onSettingsClick?: () => void;
}

interface NavItemProps {
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
  dataDashboardSettings?: boolean;
  children: ReactNode;
}

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function NavItem({
  label,
  href,
  active = false,
  onClick,
  dataDashboardSettings,
  children,
}: NavItemProps) {
  const activeClass = active
    ? "bg-swapspot-blue/10 text-swapspot-blue"
    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";
  const className = `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${activeClass}`;
  const settingsAttr = dataDashboardSettings
    ? ({ "data-dashboard-settings": "" } as const)
    : {};

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full ${className}`}
        {...settingsAttr}
      >
        {children}
        {label}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      aria-current={active ? "page" : undefined}
      {...settingsAttr}
    >
      {children}
      {label}
    </Link>
  );
}

export function DashboardSidebar({
  active = "home",
  className = "",
  onSettingsClick,
}: DashboardSidebarProps) {
  return (
    <aside
      className={`flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 ${className}`.trim()}
    >
      <Link
        href="/dashboard"
        className="mb-10 flex items-center gap-2 px-2"
        aria-label="SwapSpot home"
      >
        <svg
          className="h-9 w-9 text-swapspot-blue"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M34 14a14 14 0 0 0-22.4-5.6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M10 10l4 4-4 4"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 34a14 14 0 0 0 22.4 5.6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M38 38l-4-4 4-4"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
        <NavItem label="Home" href="/dashboard" active={active === "home"}>
          <NavIcon>
            <path d="m3 9 9-7 9 7v11H5V9Z" strokeLinejoin="round" />
            <path d="M9 22V12h6v10" />
          </NavIcon>
        </NavItem>
        <NavItem label="Swaps" href="/swaps" active={active === "swaps"}>
          <NavIcon>
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </NavIcon>
        </NavItem>
        <NavItem label="Browse" href="/browse" active={active === "browse"}>
          <NavIcon>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </NavIcon>
        </NavItem>
        <NavItem label="Chat" href="/chat" active={active === "chat"}>
          <NavIcon>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
          </NavIcon>
        </NavItem>
        <NavItem label="Profile" href="/profile" active={active === "profile"}>
          <NavIcon>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </NavIcon>
        </NavItem>
      </nav>

      <div className="mt-auto pt-6">
        <NavItem
          label="Settings"
          href="#settings"
          onClick={onSettingsClick}
          dataDashboardSettings
        >
          <NavIcon>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </NavIcon>
        </NavItem>
      </div>
    </aside>
  );
}
