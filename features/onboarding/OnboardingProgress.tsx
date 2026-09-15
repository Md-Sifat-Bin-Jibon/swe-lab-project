export interface OnboardingProgressProps {
  current?: number;
  total?: number;
}

export function OnboardingProgress({
  current = 1,
  total = 4,
}: OnboardingProgressProps) {
  return (
    <div
      className="flex gap-2"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Onboarding step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const active = step <= current;
        return (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full ${
              active ? "bg-swapspot-blue" : "bg-slate-200"
            }`}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
