import {
  LandingFooter,
  LandingHeader,
  LandingHero,
  LandingHowItWorks,
  LandingPricing,
  LandingProfiles,
  LandingSecurity,
} from "@/features/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingProfiles />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingSecurity />
      </main>
      <LandingFooter />
    </div>
  );
}
