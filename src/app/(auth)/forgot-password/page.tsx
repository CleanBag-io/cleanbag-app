"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, InputError } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    });
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-white p-8 shadow-md text-center">
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">
          Check your email
        </h2>
        <p className="text-sm text-gray-600">
          If an account exists for that email, we&apos;ve sent a password reset
          link from <span className="font-medium">noreply@cleanbag.io</span>.
          Don&apos;t forget to check your spam folder.
        </p>
        <p className="mt-6 text-center text-sm text-gray-600">
          <Link
            href="/login"
            className="font-medium text-brand-pink hover:text-brand-pink-dark"
          >
            Return to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow-md">
      <h2 className="mb-2 text-center text-2xl font-semibold text-gray-900">
        Forgot your password?
      </h2>
      <p className="mb-6 text-center text-sm text-gray-600">
        Enter your email and we&apos;ll send you a reset link.
      </p>

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

        {error && <InputError>{error}</InputError>}

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-pink hover:text-brand-pink-dark"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
