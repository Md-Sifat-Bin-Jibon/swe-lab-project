export interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label = "OR", className = "" }: DividerProps) {
  return (
    <div className={`relative flex items-center py-1 ${className}`.trim()}>
      <div className="grow border-t border-slate-200" />
      <span className="mx-4 shrink-0 text-sm text-slate-400">{label}</span>
      <div className="grow border-t border-slate-200" />
    </div>
  );
}
