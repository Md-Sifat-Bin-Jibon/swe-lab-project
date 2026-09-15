export interface SuccessIconProps {
  className?: string;
}

export function SuccessIcon({ className = "" }: SuccessIconProps) {
  return (
    <div
      className={`flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 ${className}`.trim()}
      aria-hidden="true"
    >
      <svg
        className="h-10 w-10 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <path
          d="M5 13l4 4L19 7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
