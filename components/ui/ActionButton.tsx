import Link from "next/link";

export interface ActionButtonProps {
  label: string;
  variant?: "primary" | "secondary";
  type?: "button" | "submit" | "reset";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  "data-onboarding-next"?: boolean;
}

const base =
  "rounded-lg px-6 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-swapspot-blue";

const variants = {
  primary: "bg-swapspot-blue text-white hover:bg-[#3f52c4]",
  secondary:
    "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
} as const;

export function ActionButton({
  label,
  variant = "primary",
  type = "button",
  href,
  onClick,
  disabled,
  className = "",
  "data-onboarding-next": dataOnboardingNext,
}: ActionButtonProps) {
  const classNames = `${base} ${variants[variant]} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classNames}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      {...(dataOnboardingNext ? { "data-onboarding-next": "" } : {})}
    >
      {label}
    </button>
  );
}
