import { Monitor } from "lucide-react";

interface KdsOrder {
  table: number;
  items: { name: string; qty: number }[];
  elapsed: string;
  timerColor: string;
  memo?: string;
  completed?: boolean;
}

interface KdsColumnData {
  title: string;
  icon: string;
  color: string;
  orders: KdsOrder[];
}

const columns: KdsColumnData[] = [
  {
    title: "대기",
    icon: "⏳",
    color: "bg-yellow-100 text-yellow-900",
    orders: [
      {
        table: 1,
        items: [{ name: "점심 세트A", qty: 1 }],
        elapsed: "0:56",
        timerColor: "text-green-500",
      },
    ],
  },
  {
    title: "조리중",
    icon: "🔥",
    color: "bg-orange-100 text-orange-900",
    orders: [
      {
        table: 2,
        items: [
          { name: "파스타", qty: 2 },
          { name: "사이다", qty: 2 },
        ],
        memo: "얼음 빼주세요",
        elapsed: "0:38",
        timerColor: "text-green-500",
      },
    ],
  },
  {
    title: "완료",
    icon: "✅",
    color: "bg-green-100 text-green-900",
    orders: [
      {
        table: 3,
        items: [{ name: "아키소바", qty: 3 }],
        elapsed: "14:20",
        timerColor: "text-gray-400",
        completed: true,
      },
    ],
  },
];

export function KdsPreview() {
  return (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-700 px-4">
        <div className="flex items-center gap-3">
          <Monitor className="size-5 text-orange-400" />
          <h1 className="text-lg font-bold">주방 디스플레이</h1>
          <div className="flex items-center gap-1.5 rounded-full bg-gray-800 px-2.5 py-1">
            <div className="size-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-300">연결됨</span>
          </div>
        </div>
        <span className="font-mono text-sm tabular-nums text-gray-300">
          14:32:05
        </span>
      </header>

      {/* Columns */}
      <div className="flex flex-1">
        {columns.map((col) => (
          <div key={col.title} className="flex min-w-0 flex-1 flex-col">
            {/* Column header */}
            <div className={`flex items-center gap-2 border-b border-gray-700 px-3 py-2.5 ${col.color}`}>
              <span className="text-lg">{col.icon}</span>
              <h2 className="text-sm font-bold">{col.title}</h2>
              <span className="ml-auto inline-flex size-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-gray-900">
                {col.orders.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 bg-gray-50 p-2">
              {col.orders.map((order) => (
                <div
                  key={order.table}
                  className={`w-full rounded-lg border-2 bg-white p-3 text-left ${
                    order.completed ? "border-gray-200" : "border-gray-200"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-gray-900">
                      T.{order.table}
                    </span>
                    <span className={`font-mono text-lg font-bold tabular-nums ${order.timerColor}`}>
                      {order.elapsed}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="mt-2 space-y-0.5">
                    {order.items.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <span className="truncate text-gray-700">{item.name}</span>
                        <span className="ml-2 shrink-0 font-semibold text-gray-900">
                          x{item.qty}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Memo */}
                  {order.memo && (
                    <div className="mt-2 flex items-start gap-1 rounded bg-yellow-50 px-2 py-1">
                      <span className="shrink-0 text-sm">💬</span>
                      <p className="text-xs text-yellow-800">{order.memo}</p>
                    </div>
                  )}

                  {/* Action hint */}
                  {!order.completed && (
                    <div className="mt-2 rounded bg-gray-100 py-1 text-center text-xs font-medium text-gray-500">
                      탭하여 → {col.title === "대기" ? "조리 시작" : "완료 처리"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
