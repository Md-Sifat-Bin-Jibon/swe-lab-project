"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { SkillTags } from "@/components/ui/SkillTags";
import { useToast } from "@/hooks/useToast";
import { fetchCurrentUser, updateProfile } from "@/services/api";
import { OnboardingProgress } from "./OnboardingProgress";

export function OnboardingTalentsForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [skills, setSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill with what's already saved (e.g. when the user navigates back).
  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser()
      .then((user) => {
        if (!cancelled && user.skillsOffer.length) setSkills(user.skillsOffer);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleNext() {
    if (!skills.length) {
      showToast("Add at least one skill to continue.");
      return;
    }

    setSubmitting(true);

    try {
      await updateProfile({ skillsOffer: skills });
      router.push("/onboarding/3");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Could not save your skills."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <OnboardingProgress current={2} total={4} />

      <header className="mt-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Share Your Talents
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-500">
          What skills are you ready to share with the SwapSpot community?
        </p>
      </header>

      <form
        className="mt-10 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void handleNext();
        }}
        noValidate
      >
        <SkillTags value={skills} onChange={setSkills} />

        <div className="flex justify-end gap-3 pt-4">
          <ActionButton
            label="Back"
            variant="secondary"
            href="/onboarding/1"
          />
          <ActionButton
            label={submitting ? "Saving…" : "Next"}
            variant="primary"
            type="submit"
            disabled={submitting}
            data-onboarding-next
          />
        </div>
      </form>
    </div>
  );
}
