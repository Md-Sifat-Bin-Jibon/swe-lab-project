export interface SkillPillProps {
  text: string;
  muted?: boolean;
  className?: string;
}

export function SkillPill({ text, muted = false, className = "" }: SkillPillProps) {
  const classes = muted
    ? "bg-slate-100 text-slate-600"
    : "bg-swapspot-blue/10 text-swapspot-blue";

  return (
    <span
      className={`inline-block rounded-lg px-3 py-1 text-sm font-medium ${classes} ${className}`.trim()}
    >
      {text}
    </span>
  );
}
