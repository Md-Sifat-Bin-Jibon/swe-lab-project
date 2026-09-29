"use client";

import { AppPageFrame } from "@/features/shared/AppPageFrame";
import { VerifyIdentity } from "@/features/verify/VerifyIdentity";

export default function VerifyPage() {
  return (
    <AppPageFrame>
      <VerifyIdentity />
    </AppPageFrame>
  );
}
