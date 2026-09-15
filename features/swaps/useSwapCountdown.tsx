"use client";

import { useEffect, useState } from "react";

function parseTimer(value: string | null | undefined): number | null {
  const parts = String(value || "")
    .split(":")
    .map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function formatTimer(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

/** Live HH:MM:SS countdown from a timer string. */
export function useSwapCountdown(initial: string | null | undefined): string {
  const [display, setDisplay] = useState(initial ?? "00:00:00");

  useEffect(() => {
    setDisplay(initial ?? "00:00:00");
    let seconds = parseTimer(initial) ?? 0;
    if (seconds <= 0) return;

    const id = window.setInterval(() => {
      if (seconds <= 0) {
        window.clearInterval(id);
        return;
      }
      seconds -= 1;
      setDisplay(formatTimer(seconds));
    }, 1000);

    return () => window.clearInterval(id);
  }, [initial]);

  return display;
}

export function SwapCountdown({
  timer,
  className = "",
}: {
  timer: string | null | undefined;
  className?: string;
}) {
  const value = useSwapCountdown(timer);
  return <span className={className}>{value}</span>;
}
