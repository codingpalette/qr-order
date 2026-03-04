import {
  LayoutDashboard,
  ClipboardList,
  Monitor,
  BarChart3,
  Utensils,
  QrCode,
  Settings,
  GripVertical,
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "대시보드" },
  { icon: ClipboardList, label: "주문 관리" },
  { icon: Monitor, label: "주방 (KDS)" },
  { icon: BarChart3, label: "매출 통계" },
  { icon: Utensils, label: "메뉴 관리", active: true },
  { icon: QrCode, label: "테이블/QR" },
  { icon: Settings, label: "매장 설정" },
];

const tabs = [
  { label: "전체", count: 6, active: true },
  { label: "본사 메뉴", count: 2 },
  { label: "자체 메뉴", count: 3 },
  { label: "세트 메뉴", count: 1 },
];

const menuRows = [
  { name: "점심 세트A", badge: "세트", badgeVariant: "default" as const, price: 2700, category: "점심 세트메뉴" },
  { name: "파스타", badge: "본사", badgeVariant: "secondary" as const, price: 2000, category: "메인메뉴" },
  { name: "아키소바", badge: "본사", badgeVariant: "secondary" as const, price: 1500, category: "메인메뉴" },
  { name: "뇨끼", badge: "자체", badgeVariant: "outline" as const, price: 1000, category: "사이드" },
  { name: "사이다", badge: "자체", badgeVariant: "outline" as const, price: 500, category: "음료" },
  { name: "레몬에이드", badge: "자체", badgeVariant: "outline" as const, price: 800, category: "음료" },
];

const badgeStyles: Record<string, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-muted text-muted-foreground",
  outline: "border border-border text-muted-foreground",
};

export function MenuManagementPreview() {
  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Sidebar hint */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-background">
        <div className="flex h-14 items-center px-4">
          <span className="text-lg font-bold">QR-Order Pro</span>
        </div>
        <div className="border-t border-border" />
        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6">
        <div>
          <h1 className="text-2xl font-bold">메뉴 관리</h1>
          <p className="text-sm text-muted-foreground">
            본사 메뉴 상태 관리 및 자체 메뉴를 관리합니다.
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <div
              key={tab.label}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab.active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {tab.label} ({tab.count})
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          드래그하여 고객에게 보이는 메뉴 순서를 변경할 수 있습니다.
        </p>

        {/* Menu list */}
        <div className="mt-3 space-y-2">
          {menuRows.map((menu) => (
            <div
              key={menu.name}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <GripVertical className="size-5 shrink-0 text-muted-foreground" />
              {/* Thumbnail placeholder */}
              <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted">
                <Utensils className="size-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{menu.name}</span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${badgeStyles[menu.badgeVariant]}`}
                  >
                    {menu.badge}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {menu.price.toLocaleString("ko-KR")}원
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {menu.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
