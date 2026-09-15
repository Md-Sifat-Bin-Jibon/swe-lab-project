"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { SkillTags } from "@/components/ui/SkillTags";
import { useToast } from "@/hooks/useToast";
import { updateProfile } from "@/services/api";
import { OnboardingProgress } from "./OnboardingProgress";

export function OnboardingWantsForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [skills, setSkills] = useState<string[]>(["UX/UI Design"]);
  const [submitting, setSubmitting] = useState(false);

  async function handleNext() {
    setSubmitting(true);

    try {
      await updateProfile({ skillsWant: skills });
      router.push("/onboarding/4");
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
      <OnboardingProgress current={3} total={4} />

      <header className="mt-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Skills You Want
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-500">
          What skills are you looking to learn or receive from others?
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
        <SkillTags
          label="Add Skills You Want"
          inputId="skill-want-input"
          value={skills}
          onChange={setSkills}
        />

        <div className="flex justify-end gap-3 pt-4">
          <ActionButton
            label="Back"
            variant="secondary"
            href="/onboarding/2"
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
