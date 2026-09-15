import Link from "next/link";
import { LandingLogo } from "./LandingLogo";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <LandingLogo href="/" />
          <p className="text-sm text-slate-400">
            © SwapSpot International Ltd. 2025
          </p>
        </div>
        <nav className="flex items-center gap-6" aria-label="Legal">
          <Link
            href="#"
            className="text-sm text-slate-600 transition hover:text-swapspot-blue"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-sm text-slate-600 transition hover:text-swapspot-blue"
          >
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
