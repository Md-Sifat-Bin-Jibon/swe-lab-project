"use client";

import type { MatchProfile } from "@/types";
import { MatchCard } from "@/features/browse/MatchCard";

export interface MatchGridProps {
  title: string;
  titleId: string;
  profiles: MatchProfile[];
}

export function MatchGrid({ title, titleId, profiles }: MatchGridProps) {
  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="mb-5 text-xl font-bold text-slate-900">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {profiles.map((profile) => (
          <MatchCard key={profile.id} {...profile} />
        ))}
      </div>
    </section>
  );
}
