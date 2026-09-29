import Image from "next/image";
import type { ReactNode } from "react";
import { AuthIllustration } from "@/components/layout/AuthIllustration";

/** Split auth layout (illustration + centered form) shared by auth pages. */
export function AuthPageShell({
  title,
  subtitle,
  label,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row" role="region" aria-label={label}>
      <AuthIllustration className="hidden md:flex md:w-1/2" />
      <div className="flex w-full flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:w-1/2 md:px-14 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <header className="space-y-2 text-center">
            <Image
              src="/images/logo.svg"
              alt=""
              width={52}
              height={48}
              className="mx-auto h-12 w-auto"
              priority
            />
            <h1 className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">{title}</h1>
            <p className="text-sm text-slate-500 sm:text-base">{subtitle}</p>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
