import { ProfileCreatedCard } from "@/features/onboarding/ProfileCreatedCard";

export default function OnboardingCompletePage() {
  return (
    <div className="w-full max-w-3xl">
      <p className="mb-4 text-sm text-slate-400">
        Confirmation - profile created
      </p>
      <ProfileCreatedCard />
    </div>
  );
}
