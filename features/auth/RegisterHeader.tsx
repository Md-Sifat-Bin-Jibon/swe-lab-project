import Image from "next/image";

export function RegisterHeader() {
  return (
    <header className="space-y-2 text-center">
      <Image
        src="/images/logo.svg"
        alt=""
        width={52}
        height={48}
        className="mx-auto h-12 w-auto"
        priority
      />
      <h1 className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
        Join the SwapSpot Community
      </h1>
      <p className="text-sm text-slate-500 sm:text-base">
        Unlock your potential by swapping skills with others.
      </p>
    </header>
  );
}
