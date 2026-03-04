"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/shared/providers/auth-provider";
import { useMenuCategories } from "@/entities/menu/api/useMenuCategories";
import { useMasterMenus } from "@/entities/menu/api/useMasterMenus";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";
import { TrendingDown, TrendingUp, BarChart3Icon } from "lucide-react";
import type { MasterMenu } from "@/entities/menu/model/types";

function getMarginRate(menu: MasterMenu) {
  if (menu.cost_price == null || menu.price <= 0) return null;
  return Math.round(((menu.price - menu.cost_price) / menu.price) * 100);
}

function marginColor(rate: number) {
  if (rate < 30) return "text-red-600";
  if (rate <= 50) return "text-yellow-600";
  return "text-green-600";
}

function marginBadgeVariant(rate: number): "destructive" | "outline" | "default" {
  if (rate < 30) return "destructive";
  if (rate <= 50) return "outline";
  return "default";
}

export default function CostAnalysisPage() {
  const { user } = useAuth();
  const franchiseId = user?.franchise_id ?? null;
  const { data: categories = [] } = useMenuCategories(franchiseId);
  const { data: allMenus = [] } = useMasterMenus(franchiseId);

  const [activeTab, setActiveTab] = useState("all");

  const menusWithCost = useMemo(
    () => allMenus.filter((m) => m.cost_price != null),
    [allMenus],
  );

  const filteredMenus = useMemo(
    () =>
      activeTab === "all"
        ? menusWithCost
        : menusWithCost.filter((m) => m.category_id === activeTab),
    [menusWithCost, activeTab],
  );

  const stats = useMemo(() => {
    if (menusWithCost.length === 0)
      return { avg: 0, lowestMenu: null as MasterMenu | null, highestMenu: null as MasterMenu | null };

    let totalRate = 0;
    let lowest: MasterMenu | null = null;
    let lowestRate = Infinity;
    let highest: MasterMenu | null = null;
    let highestRate = -Infinity;

    menusWithCost.forEach((m) => {
      const rate = getMarginRate(m);
      if (rate == null) return;
      totalRate += rate;
      if (rate < lowestRate) {
        lowestRate = rate;
        lowest = m;
      }
      if (rate > highestRate) {
        highestRate = rate;
        highest = m;
      }
    });

    return {
      avg: menusWithCost.length > 0 ? Math.round(totalRate / menusWithCost.length) : 0,
      lowestMenu: lowest,
      highestMenu: highest,
    };
  }, [menusWithCost]);

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? "-";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{"원가 분석"}</h1>
        <p className="text-muted-foreground text-sm">
          {"메뉴별 원가와 마진을 분석합니다."}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {"평균 마진율"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3Icon className="size-5 text-muted-foreground" />
              <span className={`text-2xl font-bold ${menusWithCost.length > 0 ? marginColor(stats.avg) : ""}`}>
                {menusWithCost.length > 0 ? `${stats.avg}%` : "-"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {"원가 등록 메뉴 "}{menusWithCost.length}{"개 / 전체 "}{allMenus.length}{"개"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {"최저 마진 메뉴"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="size-5 text-red-500" />
              {stats.lowestMenu ? (
                <div>
                  <span className="text-base font-bold">{stats.lowestMenu.name}</span>
                  <span className="ml-2 text-sm text-red-600">
                    {getMarginRate(stats.lowestMenu)}%
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">{"-"}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {"최고 마진 메뉴"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-green-500" />
              {stats.highestMenu ? (
                <div>
                  <span className="text-base font-bold">{stats.highestMenu.name}</span>
                  <span className="ml-2 text-sm text-green-600">
                    {getMarginRate(stats.highestMenu)}%
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">{"-"}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList>
              <TabsTrigger value="all">
                {"전체"} ({menusWithCost.length})
              </TabsTrigger>
              {categories.map((cat) => {
                const count = menusWithCost.filter((m) => m.category_id === cat.id).length;
                if (count === 0) return null;
                return (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    {cat.name} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardHeader>
          <CardContent>
            {filteredMenus.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3Icon className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  {"원가가 등록된 메뉴가 없습니다."}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {"메뉴 관리에서 원가를 입력해주세요."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">{"메뉴명"}</th>
                      <th className="text-left py-2 px-3 font-medium">{"카테고리"}</th>
                      <th className="text-right py-2 px-3 font-medium">{"판매가"}</th>
                      <th className="text-right py-2 px-3 font-medium">{"원가"}</th>
                      <th className="text-right py-2 px-3 font-medium">{"마진(원)"}</th>
                      <th className="text-right py-2 px-3 font-medium">{"마진율(%)"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMenus.map((menu) => {
                      const rate = getMarginRate(menu)!;
                      const margin = menu.price - (menu.cost_price ?? 0);
                      return (
                        <tr key={menu.id} className="border-b last:border-0">
                          <td className="py-2 px-3 font-medium">{menu.name}</td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {getCategoryName(menu.category_id)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {menu.price.toLocaleString("ko-KR")}{"원"}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {(menu.cost_price ?? 0).toLocaleString("ko-KR")}{"원"}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {margin.toLocaleString("ko-KR")}{"원"}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <Badge variant={marginBadgeVariant(rate)} className="text-xs">
                              {rate}{"%"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
