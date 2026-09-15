import Link from "next/link";

export function LandingCtaBox() {
  return (
    <div className="mx-auto mt-14 max-w-md rounded-xl bg-slate-100 px-6 py-8 text-center">
      <h3 className="text-lg font-bold text-slate-900">
        Ready to Start Swapping?
      </h3>
      <Link
        href="/signup"
        className="mt-5 inline-flex rounded-md bg-swapspot-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f52c4]"
      >
        Join SwapSpot Today
      </Link>
    </div>
  );
}
