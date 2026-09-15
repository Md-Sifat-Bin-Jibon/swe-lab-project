"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { BioField } from "@/components/ui/BioField";
import { FormField } from "@/components/ui/FormField";
import { LocationField } from "@/components/ui/LocationField";
import { PhoneField } from "@/components/ui/PhoneField";
import { useToast } from "@/hooks/useToast";
import { updateProfile } from "@/services/api";
import { OnboardingProgress } from "./OnboardingProgress";

export function OnboardingBasicForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleNext() {
    setSubmitting(true);

    try {
      await updateProfile({
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      router.push("/onboarding/2");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Could not save your profile."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <OnboardingProgress current={1} total={4} />

      <header className="mt-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Basic Information
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-500">
          Let&apos;s start with some foundational details to help others know
          you.
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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FormField
            id="full-name"
            label="Full Name"
            placeholder="Enter your full name"
            autocomplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <PhoneField
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <LocationField
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <BioField value={bio} onChange={(e) => setBio(e.target.value)} />

        <div className="flex justify-end gap-3 pt-4">
          <ActionButton
            label="Skip"
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
