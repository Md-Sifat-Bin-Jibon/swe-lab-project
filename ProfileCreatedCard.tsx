import Link from "next/link";
import { SuccessIcon } from "@/components/ui/SuccessIcon";

export function ProfileCreatedCard() {
  return (
    <article
      className="flex w-full max-w-3xl flex-col items-center rounded-2xl bg-white px-8 py-14 text-center shadow-sm sm:px-12 sm:py-16"
      aria-labelledby="profile-created-heading"
    >
      <SuccessIcon />

      <h1
        id="profile-created-heading"
        className="mt-8 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
      >
        Profile Created!
      </h1>
      <p className="mt-3 text-base text-slate-500">
        Your profile has been created successfully
      </p>

      <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/dashboard"
          className="block w-full rounded-lg bg-swapspot-blue px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-[#3f52c4]"
        >
          Find your match
        </Link>
        <Link
          href="/dashboard"
          className="block w-full rounded-lg border-2 border-swapspot-blue bg-white px-6 py-3 text-center text-base font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5"
        >
          Go to dashboard
        </Link>
      </div>
    </article>
  );
}
