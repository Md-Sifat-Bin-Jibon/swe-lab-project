import { LandingProfileCard } from "./LandingProfileCard";
import { landingProfiles } from "./landingProfiles";

export function LandingProfiles() {
  return (
    <section
      className="mx-auto max-w-7xl px-3 pb-14 sm:px-4 lg:px-5"
      aria-label="Featured swappers"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {landingProfiles.map((profile) => (
          <LandingProfileCard key={profile.id} {...profile} />
        ))}
      </div>
    </section>
  );
}
