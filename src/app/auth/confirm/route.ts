import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.user) {
      // Get user's role from profile to determine redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
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

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=verification_failed`);
}
