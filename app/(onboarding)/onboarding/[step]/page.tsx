import { notFound } from "next/navigation";
import { OnboardingBasicForm } from "@/features/onboarding/OnboardingBasicForm";
import { OnboardingProfileForm } from "@/features/onboarding/OnboardingProfileForm";
import { OnboardingTalentsForm } from "@/features/onboarding/OnboardingTalentsForm";
import { OnboardingWantsForm } from "@/features/onboarding/OnboardingWantsForm";

const STEP_LABELS: Record<string, string> = {
  "1": "Basic Information",
  "2": "Share Your Talents",
  "3": "Skills You Want",
  "4": "Profile Information",
};

export function generateStaticParams() {
  return [{ step: "1" }, { step: "2" }, { step: "3" }, { step: "4" }];
}

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;

  if (!STEP_LABELS[step]) {
    notFound();
  }

  return (
    <div
      className="w-full max-w-5xl rounded-2xl bg-white px-6 py-10 shadow-sm sm:px-12 sm:py-14"
      role="region"
      aria-label={STEP_LABELS[step]}
    >
      {step === "1" && <OnboardingBasicForm />}
      {step === "2" && <OnboardingTalentsForm />}
      {step === "3" && <OnboardingWantsForm />}
      {step === "4" && <OnboardingProfileForm />}
    </div>
  );
}
