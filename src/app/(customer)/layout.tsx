import type { ReactNode } from "react";

export const metadata = {
  title: "주문하기 | QR-Order Pro",
  description: "QR 코드로 간편하게 주문하세요",
};

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50">
      {children}
    </div>
  );
}
