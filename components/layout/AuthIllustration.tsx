import Image from "next/image";

export interface AuthIllustrationProps {
  /** `auth` matches auth pages; `hero` matches the landing/hero layout. */
  variant?: "auth" | "hero";
  className?: string;
}

export function AuthIllustration({
  variant = "auth",
  className = "",
}: AuthIllustrationProps) {
  if (variant === "hero") {
    return (
      <section
        className={`flex flex-1 items-center justify-center px-8 py-12 lg:px-16 lg:py-0 ${className}`.trim()}
        aria-label="SwapSpot illustration"
      >
        <Image
          src="/images/auth-left.png"
          alt="Two people shaking hands to represent skill swapping"
          className="h-auto w-full max-w-xl object-contain"
          width={640}
          height={480}
          priority
        />
      </section>
    );
  }

  return (
    <section
      className={`flex flex-1 items-center justify-center bg-white px-8 py-12 md:px-12 lg:px-16 ${className}`.trim()}
      aria-label="SwapSpot illustration"
    >
      <Image
        src="/images/auth-left.png"
        alt="Handshake illustration representing skill swapping"
        className="h-auto w-full max-w-lg object-contain"
        width={640}
        height={520}
        priority
      />
    </section>
  );
}
