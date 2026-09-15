import Image from "next/image";

export function LoginHeader() {
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
        Welcome Back to SwapSpot!
      </h1>
      <p className="text-sm text-slate-500 sm:text-base">
        Connect with a community ready to exchange skills.
      </p>
    </header>
  );
}
