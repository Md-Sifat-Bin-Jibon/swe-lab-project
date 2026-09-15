import Image from "next/image";
import Link from "next/link";

export interface LandingLogoProps {
  href?: string;
  className?: string;
  showText?: boolean;
}

export function LandingLogo({
  href = "/",
  className = "",
  showText = true,
}: LandingLogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <Image
        src="/images/logo.svg"
        alt=""
        width={52}
        height={48}
        className="h-8 w-auto shrink-0"
        priority
      />
      {showText ? (
        <span className="text-xl font-bold tracking-tight text-[#254EDB]">
          SwapSpot
        </span>
      ) : null}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center" aria-label="SwapSpot home">
      {content}
    </Link>
  );
}
