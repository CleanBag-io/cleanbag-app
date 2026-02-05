import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <Link href="/" className="flex flex-col items-center gap-3">
          <Image src="/logo.svg" alt="CleanBag" width={56} height={56} />
          <h1 className="text-3xl font-bold text-brand-pink">CleanBag</h1>
        </Link>
        {children}
      </div>
    </div>
  );
}
