import Link from "next/link";
import { LandingLogo } from "./LandingLogo";

const navLinks = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Security", href: "#security" },
];

export function LandingHeader() {
  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-3 py-3 sm:px-4 lg:gap-6 lg:px-5">
        <LandingLogo className="shrink-0" />

        <form
          action="/signup"
          className="relative mx-auto hidden min-w-0 flex-1 max-w-xl md:block"
          role="search"
        >
          <label htmlFor="header-skill-search" className="sr-only">
            Search skills
          </label>
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            id="header-skill-search"
            name="q"
            type="search"
            placeholder="What skill are you looking for?"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
          />
        </form>

        <nav
          className="ml-auto hidden items-center gap-6 lg:flex"
          aria-label="Marketing"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-swapspot-blue"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-md border border-swapspot-blue px-3 py-2 text-sm font-semibold text-swapspot-blue transition hover:bg-swapspot-blue/5 sm:px-4"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-swapspot-blue px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#3f52c4] sm:px-4"
          >
            Join
          </Link>
        </div>
      </div>
    </header>
  );
}
