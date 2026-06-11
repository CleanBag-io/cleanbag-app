"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePassword } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { PasswordInput, Label, InputError } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-lg bg-white p-8 shadow-md text-center">
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">
          Password updated
        </h2>
        <p className="text-sm text-gray-600">
          Your password has been changed. Redirecting you to sign in…
        </p>
        <p className="mt-6 text-center text-sm text-gray-600">
          <Link
            href="/login"
            className="font-medium text-brand-pink hover:text-brand-pink-dark"
          >
            Go to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow-md">
      <h2 className="mb-2 text-center text-2xl font-semibold text-gray-900">
        Set a new password
      </h2>
      <p className="mb-6 text-center text-sm text-gray-600">
        Choose a new password for your account.
      </p>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password" required>
            New password
          </Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword" required>
            Confirm new password
          </Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            disabled={isPending}
          />
        </div>

        {error && <InputError>{error}</InputError>}

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
