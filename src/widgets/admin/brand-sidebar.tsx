"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  StoreIcon,
  UtensilsIcon,
  Settings2Icon,
  UsersIcon,
  LogOutIcon,
  BarChart3Icon,
  CalculatorIcon,
  ClockIcon,
  PackageIcon,
  TicketIcon,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useFranchise } from "@/entities/franchise/api/useFranchises";
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

const brandAdminNav: NavItem[] = [
  {
    label: "대시보드",
    href: "/admin/brand",
    icon: LayoutDashboardIcon,
  },
  {
    label: "매출 통계",
    href: "/admin/brand/analytics",
    icon: BarChart3Icon,
  },
  {
    label: "매장 관리",
    href: "/admin/brand/stores",
    icon: StoreIcon,
    permission: "store:read",
  },
  {
    label: "메뉴 관리",
    href: "/admin/brand/menus",
    icon: UtensilsIcon,
    permission: "menu:read",
  },
  {
    label: "옵션 관리",
    href: "/admin/brand/options",
    icon: Settings2Icon,
    permission: "menu:read",
  },
  {
    label: "원가 분석",
    href: "/admin/brand/cost-analysis",
    icon: CalculatorIcon,
    permission: "menu:read",
  },
  {
    label: "시간대 관리",
    href: "/admin/brand/schedules",
    icon: ClockIcon,
    permission: "menu:read",
  },
  {
    label: "세트 메뉴",
    href: "/admin/brand/set-menus",
    icon: PackageIcon,
    permission: "menu:read",
  },
  {
    label: "쿠폰 관리",
    href: "/admin/brand/coupons",
    icon: TicketIcon,
    permission: "menu:read",
  },
  {
    label: "이벤트 배너",
    href: "/admin/brand/banners",
    icon: ImageIcon,
    permission: "menu:read",
  },
  {
    label: "팀원 관리",
    href: "/admin/brand/users",
    icon: UsersIcon,
    permission: "user:read",
  },
];

interface BrandSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function BrandSidebar({ open, onClose }: BrandSidebarProps) {
  const pathname = usePathname();
  const { user, hasPermission, signOut } = useAuth();
  const { data: franchise } = useFranchise(user?.franchise_id ?? null);

  const navItems = brandAdminNav.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  const sidebarContent = (
    <aside className="bg-background flex h-screen w-64 flex-col border-r">
      <div className="flex h-14 items-center px-4">
        <Link href="/admin/brand" className="text-lg font-bold truncate" onClick={onClose}>
          {franchise?.name ?? "QR-Order Pro"}
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/brand" &&
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
