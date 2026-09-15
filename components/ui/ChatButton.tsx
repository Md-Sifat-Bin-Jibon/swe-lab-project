export interface ChatButtonProps {
  label?: string;
  onClick?: () => void;
  className?: string;
}

export function ChatButton({
  label = "Chat",
  onClick,
  className = "",
}: ChatButtonProps) {
  return (
    <button
      type="button"
      data-swap-action="chat"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-swapspot-blue/10 text-swapspot-blue transition hover:bg-swapspot-blue/20 ${className}`.trim()}
      aria-label={label}
      onClick={onClick}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    </button>
  );
}
