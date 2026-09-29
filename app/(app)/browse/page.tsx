"use client";

import { Suspense } from "react";
import { PageLoading } from "@/components/shared/PageLoading";
import { BrowseView } from "@/features/browse/BrowseView";

export default function BrowsePage() {
  return (
    <Suspense fallback={<PageLoading title="Finding matches…" embedded />}>
      <BrowseView />
    </Suspense>
  );
}
