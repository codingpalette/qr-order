"use client";

import { useState } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { AdminSidebar } from "@/widgets/admin/sidebar";
import { BrandSidebar } from "@/widgets/admin/brand-sidebar";
import { StoreSidebar } from "@/widgets/admin/store-sidebar";
import { Button } from "@/shared/ui/button";
import { MenuIcon } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{"로딩 중..."}</p>
      </div>
    );
  }

  // Unsupported roles get no sidebar
  if (user?.role !== "system_admin" && user?.role !== "brand_admin" && user?.role !== "store_admin") {
    return <>{children}</>;
  }

  const Sidebar =
    user?.role === "store_admin"
      ? StoreSidebar
      : user?.role === "brand_admin"
        ? BrandSidebar
        : AdminSidebar;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="bg-background sticky top-0 z-40 flex h-14 items-center border-b px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="size-5" />
          </Button>
          <span className="ml-3 text-sm font-bold">{"QR-Order Pro"}</span>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
