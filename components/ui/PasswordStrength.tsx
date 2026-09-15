export interface PasswordStrengthProps {
  label?: string;
  filled?: number;
  total?: number;
  className?: string;
}

export function PasswordStrength({
  label = "Strong",
  filled = 2,
  total = 4,
  className = "",
}: PasswordStrengthProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <span className="text-sm font-medium text-emerald-600">{label}</span>
      <div
        className="flex flex-1 gap-1.5"
        role="progressbar"
        aria-valuenow={filled}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        {Array.from({ length: total }, (_, i) => {
          const active = i < filled;
          return (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${active ? "bg-emerald-500" : "bg-slate-200"}`}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
}
