"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { adminApi, type AdminAccount } from "@/services/adminApi";

const NAV: { href: string; label: string; icon: ReactNode; group: string }[] = [
  { group: "Overview", href: "/admin/dashboard", label: "Dashboard", icon: <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z" /> },
  { group: "Members", href: "/admin/users", label: "Users", icon: <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm11 9v-1a4 4 0 0 0-3-3.9M16 4.1a4 4 0 0 1 0 7.8" /> },
  { group: "Members", href: "/admin/verifications", label: "Verifications", icon: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Zm-3 9 2 2 4-4" /> },
  { group: "Members", href: "/admin/projects", label: "Projects", icon: <path d="M3 7h7l2 2h9v10H3V7Z" /> },
  { group: "Activity", href: "/admin/swaps", label: "Swaps", icon: <path d="M7 7h11l-3-3M17 17H6l3 3" /> },
  { group: "Activity", href: "/admin/wallet", label: "Wallet", icon: <path d="M3 7h18v12H3zM16 13h.01M3 7l3-4h12l3 4" /> },
  { group: "Activity", href: "/admin/meetings", label: "Meetings", icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4m8-4v4M3 11h18" /></> },
  { group: "Activity", href: "/admin/chat", label: "Chat", icon: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" /> },
  { group: "Activity", href: "/admin/activity", label: "Activity log", icon: <path d="M3 12h4l2 6 4-14 2 8h6" /> },
  { group: "Members", href: "/admin/moderation", label: "Moderation", icon: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Zm0 5v5m0 3h.01" /> },
  { group: "System", href: "/admin/audit", label: "Admin audit", icon: <path d="M9 12h6m-6 4h6M9 8h6M5 3h14v18H5z" /> },
  { group: "System", href: "/admin/settings", label: "Settings", icon: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.2-1.7l2-1.6-2-3.4-2.4 1a8 8 0 0 0-3-1.7L14 2h-4l-.4 2.6a8 8 0 0 0-3 1.7l-2.4-1-2 3.4 2 1.6a8.1 8.1 0 0 0 0 3.4l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 3 1.7L10 22h4l.4-2.6a8 8 0 0 0 3-1.7l2.4 1 2-3.4-2-1.6c.13-.55.2-1.12.2-1.7Z" /> },
];

function Icon({ path }: { path: ReactNode }) {
  return (
    <svg className="h-4.5 w-4.5 shrink-0" style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {path}
    </svg>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminAccount | null>(null);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    adminApi
      .me()
      .then((r) => setAdmin(r.admin))
      .catch(() => router.replace(`/admin?next=${encodeURIComponent(pathname)}`))
      .finally(() => setChecked(true));
  }, [pathname, router]);

  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 -translate-x-full overflow-y-auto border-r border-slate-800 bg-slate-900 px-4 py-5 text-slate-300 transition-transform lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : ""
        }`}
      >
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-swapspot-blue text-sm font-bold text-white">S</span>
          <div>
            <p className="text-sm font-bold text-white">SwapSpot</p>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Admin panel</p>
          </div>
        </div>

        <nav aria-label="Admin sections" className="space-y-5">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group}</p>
              <ul className="space-y-0.5">
                {NAV.filter((n) => n.group === group).map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          active ? "bg-swapspot-blue text-white" : "hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <Icon path={item.icon} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-8 border-t border-slate-800 pt-4">
          <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
            ← Back to the app
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 lg:hidden"
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{admin?.name ?? "…"}</p>
              <p className="text-xs capitalize text-slate-400">{admin?.role ?? ""}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await adminApi.logout().catch(() => {});
                router.replace("/admin");
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="p-5 lg:p-8">{checked && admin ? children : <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />}</main>
      </div>
    </div>
  );
}
