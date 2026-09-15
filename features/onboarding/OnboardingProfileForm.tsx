"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { PortfolioField } from "@/components/ui/PortfolioField";
import { ProfileUpload } from "@/components/ui/ProfileUpload";
import { useToast } from "@/hooks/useToast";
import { updateProfile } from "@/services/api";
import { OnboardingProgress } from "./OnboardingProgress";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read image."));
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

export function OnboardingProfileForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFinish() {
    setSubmitting(true);

    try {
      let avatar: string | undefined;
      if (avatarFile) {
        avatar = await fileToDataUrl(avatarFile);
      }

      await updateProfile({
        avatar,
        onboardingComplete: true,
      });
      router.push("/onboarding/complete");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Could not finish onboarding."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <p className="text-sm text-slate-400">Profile Information</p>

      <OnboardingProgress current={4} total={4} />

      <header className="mt-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Almost There!
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-500">
          Complete your profile with a picture and an optional portfolio link.
        </p>
      </header>

      <form
        className="mt-10 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          void handleFinish();
        }}
        noValidate
      >
        <ProfileUpload onFileChange={setAvatarFile} />
        <PortfolioField />

        <div className="flex justify-end gap-3 pt-4">
          <ActionButton
            label="Back"
            variant="secondary"
            href="/onboarding/3"
          />
          <ActionButton
            label={submitting ? "Finishing…" : "Finish"}
            variant="primary"
            type="submit"
            disabled={submitting}
          />
        </div>
      </form>
    </div>
  );
}
