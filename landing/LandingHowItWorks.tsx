import { LandingCtaBox } from "./LandingCtaBox";

const steps = [
  {
    title: "Propose Your Trade",
    body: "Found someone with a skill you need? Send them a swap proposal. Clearly define what skill you will offer in exchange for theirs, the scope of work, timeline, and any other important details. You can also use the messaging system to discuss before proposing.",
  },
  {
    title: "Perform the Service",
    body: "After the swap starts, both parties deliver their agreed services. Stay in touch through messaging to share progress, files, and feedback so everything stays on track through the timeline you set.",
  },
  {
    title: "Agree and Get Started",
    body: "The other user reviews your proposal. They can accept, decline, or suggest modifications. Once both parties agree on the terms, the swap is initiated. For added security, consider using the Escrow service for valuable trades.",
  },
  {
    title: "Confirm & Review",
    body: "Once both parties are satisfied that the services are completed according to the agreement, they confirm completion on the platform. You can then leave a review and rating for the other user based on your experience. A small swap fee is processed upon successful completion.",
  },
];

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-slate-100 bg-white"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-3 py-16 sm:px-4 lg:px-5">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="how-it-works-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            How SwapSpot Secures Your Swaps with Escrow
          </h2>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">
            Connecting skills, creating value, one swap at a time
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
          {steps.map((step) => (
            <article key={step.title}>
              <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                {step.body}
              </p>
            </article>
          ))}
        </div>

        <LandingCtaBox />
      </div>
    </section>
  );
}
