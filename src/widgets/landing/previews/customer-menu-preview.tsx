import { Search, Store } from "lucide-react";

const categories = ["전체", "메인메뉴", "사이드", "음료", "점심 세트메뉴"];

const menuItems = [
  { name: "점심 세트A", price: 2700, desc: "파스타 + 음료 세트", isSet: true },
  { name: "파스타", price: 2000, desc: "토마토 소스 파스타" },
  { name: "아키소바", price: 1500, desc: "일본식 볶음면" },
  { name: "뇨끼", price: 1000, desc: "감자 뇨끼" },
];

export function CustomerMenuPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <div className="flex w-[375px] flex-col overflow-hidden rounded-[2.5rem] border-[8px] border-gray-900 bg-white text-gray-900 shadow-2xl" style={{ height: "780px" }}>
      {/* Header */}
      <header className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-orange-100">
            <Store className="size-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">인천 연수점</h1>
            <p className="text-sm text-gray-500">테이블 3</p>
          </div>
        </div>
      </header>

      {/* Search bar */}
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
          <Search className="size-4 text-gray-400" />
          <span className="text-sm text-gray-400">메뉴 검색</span>
        </div>
      </div>

      {/* Category filter */}
      <div className="border-b border-gray-100 bg-white">
        <div className="flex gap-2 px-4 py-2.5">
          {categories.map((cat, i) => (
            <span
              key={cat}
              className={
                i === 0
                  ? "shrink-0 rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white"
                  : "shrink-0 rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600"
              }
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Menu list */}
      <div className="flex-1 space-y-2 bg-gray-50 p-4">
        {menuItems.map((item) => (
          <div key={item.name} className="flex w-full gap-3 rounded-xl bg-white p-3">
            {/* Thumbnail placeholder */}
            <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-2xl text-gray-300">
              🍽
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex items-center gap-1">
                <span className="truncate text-sm font-semibold text-gray-900">
                  {item.name}
                </span>
                {item.isSet && (
                  <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                    세트
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
              <span className="mt-1.5 text-sm font-bold text-gray-900">
                {item.price.toLocaleString("ko-KR")}원
              </span>
            </div>
            {/* Add button */}
            <div className="flex shrink-0 flex-col items-center justify-center">
              <div className="flex size-8 items-center justify-center rounded-full border border-orange-300 text-orange-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
