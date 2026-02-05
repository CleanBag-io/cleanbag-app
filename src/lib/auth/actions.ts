"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/config/constants";

export type AuthResult = {
  error?: string;
  success?: boolean;
};

export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Get user's role to determine redirect
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Failed to get user after login" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const rolePathMap: Record<string, string> = {
    driver: "/driver/dashboard",
    facility: "/facility/dashboard",
    agency: "/agency/dashboard",
    admin: "/admin/dashboard",
  };

  const redirectPath = profile?.role
    ? rolePathMap[profile.role]
    : "/driver/dashboard";

  revalidatePath("/", "layout");
  redirect(redirectPath);
}

export async function register(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("name") as string;
  const role = formData.get("role") as Role;

  if (!email || !password || !fullName || !role) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    // Email confirmation required
    return { success: true };
  }

  // Auto-confirmed (development mode or email confirmation disabled)
  if (data.session) {
    const rolePathMap: Record<string, string> = {
      driver: "/driver/dashboard",
      facility: "/facility/dashboard",
      agency: "/agency/dashboard",
      admin: "/admin/dashboard",
    };

    revalidatePath("/", "layout");
    redirect(rolePathMap[role] || "/driver/dashboard");
  }

  return { success: true };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function updateProfile(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string | null;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
