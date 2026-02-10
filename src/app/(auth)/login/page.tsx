"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { login } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput, Label, InputError } from "@/components/ui/input";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const error_param = searchParams.get("error");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <>
      {redirect && (
        <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
          Please sign in to continue.
        </div>
      )}

      {error_param && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error_param === "auth_callback_error"
            ? "Failed to verify your email. Please try again."
            : error_param === "verification_failed"
              ? "Email verification failed. Please try again."
              : "An error occurred. Please try again."}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="password" required>
            Password
          </Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            disabled={isPending}
          />
        </div>

        {error && <InputError>{error}</InputError>}

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="rounded-lg bg-white p-8 shadow-md">
      <h2 className="mb-6 text-center text-2xl font-semibold text-gray-900">
        Welcome back
      </h2>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded bg-gray-100" />
            <div className="h-20 animate-pulse rounded bg-gray-100" />
            <div className="h-11 animate-pulse rounded bg-gray-100" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>

      <p className="mt-4 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-brand-pink hover:text-brand-pink-dark"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
