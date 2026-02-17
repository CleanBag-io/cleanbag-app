"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { register } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput, Label, Select, InputError } from "@/components/ui/input";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await register(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            Check your email
          </h2>
          <p className="mb-6 text-gray-600">
            We&apos;ve sent you a confirmation link. Please check your email to
            verify your account.
          </p>
          <Link
            href="/login"
            className="font-medium text-brand-pink hover:text-brand-pink-dark"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow-md">
      <h2 className="mb-6 text-center text-2xl font-semibold text-gray-900">
        Create your account
      </h2>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" required>
            Full Name
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            autoComplete="name"
            required
            disabled={isPending}
          />
        </div>

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
            autoComplete="new-password"
            required
            minLength={6}
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-gray-500">
            Must be at least 6 characters
          </p>
        </div>

        <div>
          <Label htmlFor="role" required>
            I am a...
          </Label>
          <Select id="role" name="role" required disabled={isPending}>
            <option value="driver">Delivery Driver</option>
            <option value="facility">Cleaning Facility</option>
            <option value="agency">Company</option>
          </Select>
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            name="terms"
            required
            disabled={isPending}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-pink focus:ring-brand-pink"
          />
          <label htmlFor="terms" className="text-sm text-gray-600">
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-pink hover:text-brand-pink-dark"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-pink hover:text-brand-pink-dark"
            >
              Privacy Policy
            </a>
          </label>
        </div>

        {error && <InputError>{error}</InputError>}

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{" "}
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
