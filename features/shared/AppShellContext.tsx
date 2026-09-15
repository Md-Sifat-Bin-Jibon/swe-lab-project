"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  DashboardSidebar,
  type DashboardNavKey,
} from "@/components/layout/DashboardSidebar";
import { useToast } from "@/hooks/useToast";
import { SettingsModal } from "@/features/shared/SettingsModal";
import { SwapActionsProvider } from "@/features/swaps/SwapActionsProvider";

interface AppShellContextValue {
  openSettings: () => void;
  closeSettings: () => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell(): AppShellContextValue {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within AppShellProvider");
  }
  return context;
}

function navKeyFromPathname(pathname: string): DashboardNavKey {
  if (pathname.startsWith("/swaps")) return "swaps";
  if (pathname.startsWith("/browse") || pathname.startsWith("/profiles")) {
    return "browse";
  }
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/profile")) return "profile";
  return "home";
}

export function AppShellProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = navKeyFromPathname(pathname);
  const { showToast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSettings();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeSettings]);

  const value = useMemo(
    () => ({ openSettings, closeSettings }),
    [openSettings, closeSettings]
  );

  return (
    <AppShellContext.Provider value={value}>
      <SwapActionsProvider>
        <div className="flex min-h-screen bg-slate-50">
          <DashboardSidebar active={active} onSettingsClick={openSettings} />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>

        <SettingsModal
          open={settingsOpen}
          onClose={closeSettings}
          onSave={() => {
            closeSettings();
            showToast("Settings saved.");
          }}
        />
      </SwapActionsProvider>
    </AppShellContext.Provider>
  );
}
