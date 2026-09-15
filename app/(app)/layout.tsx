"use client";

import { AppShellProvider } from "@/features/shared/AppShellContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellProvider>{children}</AppShellProvider>;
}
