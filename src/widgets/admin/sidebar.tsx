"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  BuildingIcon,
  UsersIcon,
  SettingsIcon,
  LogOutIcon,
} from "lucide-react";
import { useAuth } from "@/shared/providers/auth-provider";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";
import type { Permission } from "@/entities/user/model/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
}

const systemAdminNav: NavItem[] = [
  {
    label: "대시보드",
    href: "/admin/system",
    icon: LayoutDashboardIcon,
  },
  {
    label: "프랜차이즈 관리",
    href: "/admin/system/franchises",
    icon: BuildingIcon,
    permission: "franchise:read",
  },
  {
    label: "사용자 관리",
    href: "/admin/system/users",
    icon: UsersIcon,
    permission: "user:read",
  },
  {
    label: "설정",
    href: "/admin/system/settings",
    icon: SettingsIcon,
    permission: "settings:read",
  },
];

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, hasPermission, signOut } = useAuth();

  const navItems = systemAdminNav.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  const sidebarContent = (
    <aside className="bg-background flex h-screen w-64 flex-col border-r">
      <div className="flex h-14 items-center px-4">
        <Link href="/admin/system" className="text-lg font-bold" onClick={onClose}>
          {"QR-Order Pro"}
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/system" &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="p-4">
        <div className="mb-3 truncate">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-muted-foreground text-xs truncate">
            {user?.email}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={signOut}
        >
          <LogOutIcon className="size-4" />
          {"로그아웃"}
        </Button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block sticky top-0 h-screen">{sidebarContent}</div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
