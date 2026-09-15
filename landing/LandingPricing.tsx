import Link from "next/link";

const premiumFeatures = [
  "Zero Swap Fee",
  "Boosted listings",
  "Faster matching",
  "Priority visibility",
];

export function LandingPricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-t border-slate-100 bg-white"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-7xl px-3 py-16 sm:px-4 lg:px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="pricing-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            Our Simple Pricing
          </h2>
          <p className="mt-3 text-base text-slate-500">
            Choose the plan that best fits your skill-swapping journey.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          <article className="flex flex-col rounded-2xl bg-[#f3f0ff] p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">
              Our Simple Pricing
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              A small fee per successful swap.
            </p>
            <p className="mt-8 text-3xl font-bold tracking-tight text-slate-900">
              5%
              <span className="text-lg font-semibold text-slate-600">
                /of the Escrow amount
              </span>
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex w-fit rounded-md bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f52c4]"
            >
              Get Started
            </Link>
          </article>

          <article className="flex flex-col rounded-2xl bg-[#fff3e8] p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">
              Premium Membership
            </h3>
            <ul className="mt-4 space-y-2">
              {premiumFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-3xl font-bold tracking-tight text-slate-900">
              $50
              <span className="text-lg font-semibold text-slate-600">
                /month
              </span>
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex w-fit rounded-md bg-[#f08a3a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e07a2a]"
            >
              Upgrade Now
            </Link>
          </article>
        </div>

        <div className="mx-auto mt-10 max-w-4xl rounded-2xl bg-slate-100 px-6 py-10 text-center shadow-sm sm:px-10">
          <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Secure Your Trades with Escrow
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
            For high-value trades, we recommend using our secure escrow service.
            A small fee applies for using this service, ensuring peace of mind
            for both parties.
          </p>
          <Link
            href="#security"
            className="mt-6 inline-flex rounded-md bg-swapspot-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f52c4]"
          >
            Learn About Escrow
          </Link>
        </div>
      </div>
    </section>
  );
}
