import Image from "next/image";
import Link from "next/link";

const quickLinks = [
  { label: "Find a Skill", href: "/signup" },
  { label: "Offer a Skill", href: "/signup" },
  { label: "Learn & Grow", href: "/signup" },
];

export function LandingHero() {
  return (
    <section
      className="mx-auto grid max-w-7xl items-center gap-10 px-3 py-10 sm:px-4 lg:grid-cols-2 lg:gap-12 lg:px-5 lg:py-14"
      aria-labelledby="landing-heading"
    >
      <div className="min-w-0">
        <h1
          id="landing-heading"
          className="text-3xl font-bold leading-tight tracking-tight text-swapspot-blue sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
        >
          The Skill Swap Marketplace!!!
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
          Connect with creators, professionals, and learners to exchange
          services without the price tag.
        </p>

        <form action="/signup" className="mt-8" role="search">
          <label htmlFor="hero-skill-search" className="sr-only">
            Search for a skill
          </label>
          <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm focus-within:border-swapspot-blue focus-within:ring-2 focus-within:ring-swapspot-blue/20">
            <input
              id="hero-skill-search"
              name="q"
              type="search"
              placeholder="What skill are you looking for? or e.g., Logo Design, Copywriting, Language..."
              className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-base"
            />
            <button
              type="submit"
              className="flex h-auto w-14 shrink-0 items-center justify-center bg-swapspot-blue text-white transition hover:bg-[#3f52c4]"
              aria-label="Search skills"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-md border border-swapspot-blue px-4 py-2 text-sm font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
        <Image
          src="/images/banner-BkazWQGx.png"
          alt="People collaborating and exchanging skills around the globe"
          width={651}
          height={260}
          priority
          className="h-auto w-full object-contain"
        />
      </div>
    </section>
  );
}
