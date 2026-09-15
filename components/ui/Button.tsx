import Link from "next/link";

export interface ButtonProps {
  label: string;
  variant?: "primary" | "outline";
  href?: string;
  as?: "link" | "submit" | "button";
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const base =
  "block w-full rounded-lg px-8 py-3 text-center text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-swapspot-blue";

const variants = {
  primary:
    "bg-swapspot-blue text-white hover:bg-[#3f52c4] active:bg-[#3648b3]",
  outline:
    "border-2 border-swapspot-blue bg-transparent text-swapspot-blue hover:bg-swapspot-blue/5 active:bg-swapspot-blue/10",
} as const;

export function Button({
  label,
  variant = "primary",
  href = "#",
  as = "link",
  type = "button",
  onClick,
  disabled,
  className = "",
}: ButtonProps) {
  const classNames = `${base} ${variants[variant]} ${className}`.trim();

  if (as === "submit") {
    return (
      <button type="submit" className={classNames} disabled={disabled}>
        {label}
      </button>
    );
  }

  if (as === "button") {
    return (
      <button
        type={type}
        className={classNames}
        onClick={onClick}
        disabled={disabled}
      >
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={classNames}>
      {label}
    </Link>
  );
}
