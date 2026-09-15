export interface SwapSpotLogoProps {
  className?: string;
}

export function SwapSpotLogo({ className = "" }: SwapSpotLogoProps) {
  return (
    <svg
      className={`mx-auto h-12 w-12 text-swapspot-blue ${className}`.trim()}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M34 14a14 14 0 0 0-22.4-5.6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M10 10l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 34a14 14 0 0 0 22.4 5.6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M38 38l-4-4 4-4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
