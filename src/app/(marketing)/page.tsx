import Image from "next/image";
import Link from "next/link";
import { ContactEmail } from "@/components/contact-email";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Hero Section */}
      <header className="bg-white shadow-sm">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="CleanBag" width={32} height={32} />
              <span className="text-2xl font-bold text-brand-pink">CleanBag</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand-pink px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-pink-dark"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Professional Bag Cleaning for
              <span className="text-brand-pink"> Delivery Drivers</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Keep your delivery bags clean, sanitized, and compliant with food safety standards.
              Find certified cleaning facilities near you in Cyprus.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="rounded-md bg-brand-pink px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-pink-dark"
              >
                Find a Cleaning Facility
              </Link>
              <Link
                href="/register?role=facility"
                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                List Your Cleaning Facility
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-pink-light">
                  <svg className="h-8 w-8 text-brand-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">Find Nearby Cleaning Facilities</h3>
                <p className="mt-2 text-gray-600">Locate certified cleaning facilities near your delivery routes across Cyprus.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-trust-blue-light">
                  <svg className="h-8 w-8 text-trust-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">Stay Compliant</h3>
                <p className="mt-2 text-gray-600">Track your cleaning history and maintain food safety compliance with ease.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-completed/10">
                  <svg className="h-8 w-8 text-status-completed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">Fair Pricing</h3>
                <p className="mt-2 text-gray-600">Transparent pricing from €4.50 per clean. No hidden fees.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6">
            <h3 className="text-lg font-semibold text-white">Contact Us</h3>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <ContactEmail className="text-gray-300 hover:text-white transition-colors" />
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.264-1.227l-.3-.18-2.868.852.852-2.868-.18-.3A8 8 0 1112 20z" />
                </svg>
                <a
                  href="https://wa.me/35799544873"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  +357 99 544873
                </a>
              </div>
            </div>
            <p className="mt-4 text-gray-500 text-sm">&copy; 2026 CleanBag. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
