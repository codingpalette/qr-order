"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { QrCode, Menu, X, UserIcon, LayoutDashboardIcon, LogOutIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/shared/providers/auth-provider";
import { ConsultationModal } from "./consultation-modal";

const ROLE_DASHBOARD: Record<string, string> = {
  system_admin: "/admin/system",
  brand_admin: "/admin/brand",
  store_admin: "/admin/store",
};

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const { user, isLoading, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardHref = user ? (ROLE_DASHBOARD[user.role] ?? "/admin/system") : "/login";

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/50 bg-background/80 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <QrCode className="size-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">
            QR-Order Pro
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {"기능 소개"}
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {"이용 방법"}
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {"요금제"}
          </a>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          {!isLoading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="gap-2">
                    <UserIcon className="size-4" />
                    {user.name}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-xs">{user.email}</p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <Link href={dashboardHref} className="gap-2">
                      <LayoutDashboardIcon className="size-4" />
                      {"대시보드"}
                    </Link>
                  }
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="gap-2">
                  <LogOutIcon className="size-4" />
                  {"로그아웃"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              {"로그인"}
            </Link>
          )}
          <Button size="sm" onClick={() => setConsultationOpen(true)}>{"무료 도입 상담"}</Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="flex items-center justify-center md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="size-6 text-foreground" />
          ) : (
            <Menu className="size-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background/95 px-6 pb-6 pt-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-4">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {"기능 소개"}
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {"이용 방법"}
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {"요금제"}
            </a>
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            {!isLoading && user ? (
              <>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-muted-foreground text-xs">{user.email}</p>
                </div>
                <Link href={dashboardHref} className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2")}>
                  <LayoutDashboardIcon className="size-4" />
                  {"대시보드"}
                </Link>
                <Button variant="ghost" className="w-full gap-2" onClick={signOut}>
                  <LogOutIcon className="size-4" />
                  {"로그아웃"}
                </Button>
              </>
            ) : (
              <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                {"로그인"}
              </Link>
            )}
            <Button className="w-full" onClick={() => setConsultationOpen(true)}>{"무료 도입 상담"}</Button>
          </div>
        </div>
      )}
      <ConsultationModal open={consultationOpen} onOpenChange={setConsultationOpen} />
    </header>
  );
}
