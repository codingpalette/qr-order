"use client";

import Link from "next/link";
import { useAuth } from "@/shared/providers/auth-provider";
import { useFranchises } from "@/entities/franchise/api/useFranchises";
import { useStores } from "@/entities/store/api/useStores";
import { usePendingUsers } from "@/entities/user/api/useUsers";
import { useApproveUser } from "@/features/user-management/api/mutations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@/shared/ui";
import {
  BuildingIcon,
  StoreIcon,
  UsersIcon,
  ArrowRightIcon,
  CheckIcon,
} from "lucide-react";
import type { UserRole } from "@/entities/user/model/types";

export default function SystemAdminDashboard() {
  const { user } = useAuth();
  const { data: franchises = [] } = useFranchises();
  const { data: stores = [] } = useStores();
  const { data: pendingUsers = [] } = usePendingUsers();
  const approveUser = useApproveUser();

  const stats = [
    {
      label: "프랜차이즈",
      value: franchises.length,
      icon: BuildingIcon,
      href: "/admin/system/franchises",
    },
    {
      label: "매장",
      value: stores.length,
      icon: StoreIcon,
      href: "/admin/system/franchises",
    },
    {
      label: "승인 대기",
      value: pendingUsers.length,
      icon: UsersIcon,
      href: "/admin/system/users",
    },
  ];

  const handleQuickApprove = (userId: string) => {
    approveUser.mutate({
      userId,
      role: "brand_admin" as Exclude<UserRole, "pending">,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{"대시보드"}</h1>
        <p className="text-muted-foreground">
          {"안녕하세요, "}
          {user?.name}
          {"님"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
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
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{"최근 가입 신청"}</CardTitle>
            <Link href="/admin/system/users">
              <Button variant="ghost" size="sm" className="gap-1">
                {"전체보기"}
                <ArrowRightIcon className="size-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingUsers.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-muted-foreground text-xs">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{"대기중"}</Badge>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleQuickApprove(u.id)}
                      disabled={approveUser.isPending}
                    >
                      <CheckIcon className="size-3" />
                      {"승인"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Franchises */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{"최근 프랜차이즈"}</CardTitle>
          <Link href="/admin/system/franchises">
            <Button variant="ghost" size="sm" className="gap-1">
              {"전체보기"}
              <ArrowRightIcon className="size-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {franchises.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {"등록된 프랜차이즈가 없습니다."}
            </p>
          ) : (
            <div className="space-y-3">
              {franchises.slice(0, 5).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{f.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(f.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <Badge variant={f.is_active ? "default" : "secondary"}>
                    {f.is_active ? "활성" : "비활성"}
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
