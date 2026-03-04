"use client";

import Link from "next/link";
import { useAuth } from "@/shared/providers/auth-provider";
import { useTodayOrders } from "@/entities/order/api/useOrders";
import { useLocalMenus } from "@/entities/order/api/useLocalMenus";
import { useMasterMenus } from "@/entities/menu/api/useMasterMenus";
import { useTables } from "@/entities/store/api/useTables";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@/shared/ui";
import {
  ClipboardListIcon,
  UtensilsIcon,
  QrCodeIcon,
  BanknoteIcon,
  ArrowRightIcon,
  ClockIcon,
} from "lucide-react";
import type { OrderStatus } from "@/entities/order/model/types";

const statusLabels: Record<OrderStatus, string> = {
  pending: "대기",
  confirmed: "확인",
  preparing: "조리중",
  completed: "완료",
  cancelled: "취소",
};

const statusVariants: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "default",
  confirmed: "secondary",
  preparing: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export default function StoreDashboard() {
  const { user } = useAuth();
  const storeId = user?.store_id ?? null;
  const franchiseId = user?.franchise_id ?? null;
  const { data: todayOrders = [] } = useTodayOrders(storeId);
  const { data: localMenus = [] } = useLocalMenus(storeId);
  const { data: masterMenus = [] } = useMasterMenus(franchiseId);
  const { data: tables = [] } = useTables(storeId);

  const pendingOrders = todayOrders.filter((o) => o.status === "pending" || o.status === "preparing");
  const todaySales = todayOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.total_amount, 0);
  const totalMenus = masterMenus.length + localMenus.length;

  const stats = [
    {
      label: "오늘 주문",
      value: todayOrders.length,
      sub: `${pendingOrders.length}건 처리중`,
      icon: ClipboardListIcon,
      href: "/admin/store/orders",
    },
    {
      label: "오늘 매출",
      value: `${todaySales.toLocaleString("ko-KR")}원`,
      sub: "완료된 주문 기준",
      icon: BanknoteIcon,
      href: "/admin/store/orders",
    },
    {
      label: "메뉴",
      value: totalMenus,
      sub: `본사 ${masterMenus.length} + 자체 ${localMenus.length}`,
      icon: UtensilsIcon,
      href: "/admin/store/menus",
    },
    {
      label: "테이블",
      value: tables.length,
      sub: "QR 코드 관리",
      icon: QrCodeIcon,
      href: "/admin/store/tables",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{"매장 대시보드"}</h1>
        <p className="text-muted-foreground">
          {"안녕하세요, "}
          {user?.name}
          {"님"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-muted-foreground text-xs mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending Orders Alert */}
      {pendingOrders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClockIcon className="size-4" />
              {"처리 대기중인 주문이 "}
              {pendingOrders.length}
              {"건 있습니다"}
            </CardTitle>
            <Link href="/admin/store/orders">
              <Button variant="outline" size="sm" className="gap-1">
                {"주문 관리"}
                <ArrowRightIcon className="size-3" />
              </Button>
            </Link>
          </CardHeader>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{"최근 주문"}</CardTitle>
          <Link href="/admin/store/orders">
            <Button variant="ghost" size="sm" className="gap-1">
              {"전체보기"}
              <ArrowRightIcon className="size-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {todayOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              {"오늘 접수된 주문이 없습니다."}
            </p>
          ) : (
            <div className="space-y-3">
              {todayOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {"테이블 "}
                      {order.table_number}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {order.total_amount.toLocaleString("ko-KR")}{"원 · "}
                      {new Date(order.created_at).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge variant={statusVariants[order.status as OrderStatus]}>
                    {statusLabels[order.status as OrderStatus]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
