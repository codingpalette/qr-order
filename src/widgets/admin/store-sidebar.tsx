"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  ClipboardListIcon,
  UtensilsIcon,
  QrCodeIcon,
  SettingsIcon,
  LogOutIcon,
  MonitorIcon,
  BarChart3Icon,
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

const storeAdminNav: NavItem[] = [
  {
    label: "대시보드",
    href: "/admin/store",
    icon: LayoutDashboardIcon,
  },
  {
    label: "주문 관리",
    href: "/admin/store/orders",
    icon: ClipboardListIcon,
    permission: "order:read",
  },
  {
    label: "주방 (KDS)",
    href: "/admin/store/kitchen",
    icon: MonitorIcon,
    permission: "order:read",
  },
  {
    label: "매출 통계",
    href: "/admin/store/analytics",
    icon: BarChart3Icon,
    permission: "order:read",
  },
  {
    label: "메뉴 관리",
    href: "/admin/store/menus",
    icon: UtensilsIcon,
    permission: "menu:read",
  },
  {
    label: "테이블/QR",
    href: "/admin/store/tables",
    icon: QrCodeIcon,
    permission: "store:read",
  },
  {
    label: "매장 설정",
    href: "/admin/store/settings",
    icon: SettingsIcon,
    permission: "store:write",
  },
];

interface StoreSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function StoreSidebar({ open, onClose }: StoreSidebarProps) {
  const pathname = usePathname();
  const { user, hasPermission, signOut } = useAuth();

  const navItems = storeAdminNav.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  const sidebarContent = (
    <aside className="bg-background flex h-screen w-64 flex-col border-r">
      <div className="flex h-14 items-center px-4">
        <Link href="/admin/store" className="text-lg font-bold truncate" onClick={onClose}>
          {"QR-Order Pro"}
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/store" &&
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
      <div className="hidden md:block sticky top-0 h-screen">{sidebarContent}</div>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
