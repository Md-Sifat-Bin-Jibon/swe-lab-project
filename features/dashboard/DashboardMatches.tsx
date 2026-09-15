"use client";

import type { MatchProfile } from "@/types";
import { MatchGrid } from "@/features/browse/MatchGrid";

export interface DashboardMatchesProps {
  profiles: MatchProfile[];
}

export function DashboardMatches({ profiles }: DashboardMatchesProps) {
  return (
    <div data-dashboard-matches>
      <MatchGrid
        title="Matches For You"
        titleId="matches-heading"
        profiles={profiles}
      />
    </div>
  );
}
