"use client";

import { useEffect, useState } from "react";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/**
 * Avatar image that never renders an empty `src`: with no URL (e.g. while the
 * user is still loading) or a broken one, it shows the person's initials.
 */
export function Avatar({
  src,
  name,
  size,
  className = "",
  alt,
}: {
  src?: string | null;
  name: string;
  size: number;
  className?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = src?.trim() || "";

  useEffect(() => setFailed(false), [url]);

  if (!url || failed) {
    return (
      <span
        role="img"
        aria-label={alt ?? name}
        className={`inline-flex shrink-0 select-none items-center justify-center bg-swapspot-blue/10 font-semibold text-swapspot-blue ${className}`.trim()}
        style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.36)) }}
      >
        {initialsOf(name)}
      </span>
    );
  }

  return (
    // External avatar URLs — plain img avoids next.config remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt ?? name}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`shrink-0 object-cover ${className}`.trim()}
    />
  );
}
