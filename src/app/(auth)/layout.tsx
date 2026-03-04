import { redirect } from "next/navigation";
import { createClient } from "@/shared/api/supabase/server";
import { QrCode } from "lucide-react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Already logged in - check profile and redirect
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role, is_approved")
      .eq("id", user.id)
      .single();

    console.log("[Auth Layout]", { userId: user.id, profile, profileError });

    if (profile) {
      const role = profile.role as string;
      const isApproved = profile.is_approved as boolean;

      if (!isApproved || role === "pending") {
        redirect("/pending-approval");
      }
      switch (role) {
        case "system_admin":
          redirect("/admin/system");
          break;
        case "brand_admin":
          redirect("/admin/brand");
          break;
        case "store_admin":
          redirect("/admin/store");
          break;
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
          <QrCode className="size-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">QR-Order Pro</span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
