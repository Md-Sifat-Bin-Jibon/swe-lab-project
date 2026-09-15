import { LandingCtaBox } from "./LandingCtaBox";

const escrowSteps = [
  "Both parties agree to use Escrow for the swap.",
  "The agreed-upon value (or a portion thereof) is held securely by SwapSpot.",
  "Both parties complete their respective skill services.",
  "Upon mutual confirmation of completion, the funds are released.",
  "If a dispute arises, SwapSpot's dispute resolution process is initiated.",
];

const escrowBenefits = [
  {
    title: "Security:",
    body: "Funds are held until the service is completed to satisfaction.",
  },
  {
    title: "Trust:",
    body: "Builds confidence between users who may not know each other.",
  },
  {
    title: "Protection:",
    body: "Provides a process for resolving disagreements.",
  },
  {
    title: "Peace of Mind:",
    body: "Reduces the risk of non-completion or unsatisfactory work.",
  },
];

export function LandingSecurity() {
  return (
    <section
      id="security"
      className="scroll-mt-20 border-t border-slate-100 bg-white"
      aria-labelledby="security-heading"
    >
      <div className="mx-auto max-w-7xl px-3 py-16 sm:px-4 lg:px-5">
        <div className="max-w-3xl">
          <h2
            id="security-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            Secure Your Swaps with Escrow
          </h2>
          <p className="mt-2 text-base text-slate-600">
            Peace of mind for your valuable skill exchanges.
          </p>

          <div className="mt-10 space-y-10">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                What is Escrow?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Escrow is a financial arrangement where a third party holds and
                regulates payment of the funds required for two parties involved
                in a given transaction. It helps make transactions more secure
                by keeping the payment in a secure escrow account which is only
                released when all of the terms of an agreement are met as
                overseen by the escrow company. SwapSpot uses escrow to add an
                extra layer of security to your skill trades.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                How SwapSpot Escrow Works
              </h3>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-600 sm:text-base">
                {escrowSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Why Use Escrow?
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600 sm:text-base">
                {escrowBenefits.map((item) => (
                  <li key={item.title}>
                    <span className="font-bold text-slate-900">{item.title}</span>{" "}
                    {item.body}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Escrow Fee</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                A small fee is charged for using the Escrow service to cover the
                costs of securely holding funds and managing the dispute
                resolution process. This fee will be clearly displayed when you
                choose to use Escrow for a swap.
              </p>
            </div>
          </div>
        </div>

        <LandingCtaBox />
      </div>
    </section>
  );
}
