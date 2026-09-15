"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export interface StatCardProps {
  icon: ReactNode;
  value: string;
  label: string;
  bgClass: string;
  href?: string;
  onClick?: () => void;
}

export function StatCard({
  icon,
  value,
  label,
  bgClass,
  href,
  onClick,
}: StatCardProps) {
  const sharedClass = `w-full rounded-2xl p-5 text-left transition hover:ring-2 hover:ring-swapspot-blue/20 ${bgClass}`;

  const body = (
    <>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/60">
        {icon}
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${sharedClass} block`}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={sharedClass}>
      {body}
    </button>
  );
}
