"use client";

import Link from "next/link";
import { useAuth } from "@/shared/providers/auth-provider";
import { useFranchise } from "@/entities/franchise/api/useFranchises";
import { useStores } from "@/entities/store/api/useStores";
import { useMenuCategories } from "@/entities/menu/api/useMenuCategories";
import { useMasterMenus } from "@/entities/menu/api/useMasterMenus";
import { useFranchiseUsers, useFranchisePendingUsers } from "@/entities/user/api/useFranchiseUsers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@/shared/ui";
import {
  StoreIcon,
  UtensilsIcon,
  UsersIcon,
  TagIcon,
  ArrowRightIcon,
} from "lucide-react";

export default function BrandDashboard() {
  const { user } = useAuth();
  const franchiseId = user?.franchise_id ?? null;
  const { data: franchise } = useFranchise(franchiseId);
  const { data: stores = [] } = useStores(franchiseId);
  const { data: categories = [] } = useMenuCategories(franchiseId);
  const { data: menus = [] } = useMasterMenus(franchiseId);
  const { data: members = [] } = useFranchiseUsers(franchiseId);
  const { data: pendingUsers = [] } = useFranchisePendingUsers(franchiseId);

  const activeStores = stores.filter((s) => s.is_active);
  const activeMenus = menus.filter((m) => m.is_active);

  const stats = [
    {
      label: "매장",
      value: stores.length,
      sub: `${activeStores.length}개 운영중`,
      icon: StoreIcon,
      href: "/admin/brand/stores",
    },
    {
      label: "메뉴",
      value: menus.length,
      sub: `${activeMenus.length}개 판매중`,
      icon: UtensilsIcon,
      href: "/admin/brand/menus",
    },
    {
      label: "카테고리",
      value: categories.length,
      sub: "메뉴 분류",
      icon: TagIcon,
      href: "/admin/brand/menus",
    },
    {
      label: "팀원",
      value: members.length,
      sub: pendingUsers.length > 0 ? `${pendingUsers.length}명 대기중` : "전체 팀원",
      icon: UsersIcon,
      href: "/admin/brand/users",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          {franchise?.name ?? "브랜드"} {"대시보드"}
        </h1>
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
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-muted-foreground text-xs mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending Users Alert */}
      {pendingUsers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {"승인 대기중인 팀원이 "}
              {pendingUsers.length}
              {"명 있습니다"}
            </CardTitle>
            <Link href="/admin/brand/users">
              <Button variant="outline" size="sm" className="gap-1">
                {"관리하기"}
                <ArrowRightIcon className="size-3" />
              </Button>
            </Link>
          </CardHeader>
        </Card>
      )}

      {/* Recent Stores */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{"매장 현황"}</CardTitle>
          <Link href="/admin/brand/stores">
            <Button variant="ghost" size="sm" className="gap-1">
              {"전체보기"}
              <ArrowRightIcon className="size-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stores.length === 0 ? (
            <div className="text-center py-6">
              <StoreIcon className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                {"등록된 매장이 없습니다."}
              </p>
              <Link href="/admin/brand/stores">
                <Button variant="outline" size="sm" className="mt-3">
                  {"매장 추가하기"}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stores.slice(0, 5).map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{store.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {store.address ?? "주소 미등록"}
                    </p>
                  </div>
                  <Badge variant={store.is_active ? "default" : "secondary"}>
                    {store.is_active ? "운영중" : "비활성"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Menus */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{"메뉴 현황"}</CardTitle>
          <Link href="/admin/brand/menus">
            <Button variant="ghost" size="sm" className="gap-1">
              {"전체보기"}
              <ArrowRightIcon className="size-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {menus.length === 0 ? (
            <div className="text-center py-6">
              <UtensilsIcon className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                {"등록된 메뉴가 없습니다."}
              </p>
              <Link href="/admin/brand/menus">
                <Button variant="outline" size="sm" className="mt-3">
                  {"메뉴 추가하기"}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {menus.slice(0, 5).map((menu) => (
                <div
                  key={menu.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{menu.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {menu.price.toLocaleString("ko-KR")}{"원"}
                    </p>
                  </div>
                  <Badge variant={menu.is_active ? "default" : "secondary"}>
                    {menu.is_active ? "판매중" : "숨김"}
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
