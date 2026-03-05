import { ScanLine, MonitorSmartphone, BarChart3 } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: ScanLine,
    title: "QR 스캔으로 바로 주문",
    description:
      "테이블 위 QR 코드를 카메라로 스캔하면 별도 앱 설치 없이 바로 메뉴를 확인하고 주문할 수 있습니다.",
  },
  {
    step: "02",
    icon: MonitorSmartphone,
    title: "실시간 주방 전달",
    description:
      "주문 접수 즉시 주방 디스플레이에 알림이 전송되어 빠르고 정확한 주문 처리가 가능합니다.",
  },
  {
    step: "03",
    icon: BarChart3,
    title: "통합 대시보드 관리",
    description:
      "실시간 매출 데이터, 인기 메뉴 분석, 가맹점별 성과를 통합 대시보드에서 한 번에 관리하세요.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {"이용 방법"}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {"간단한 3단계로 시작하세요"}
          </h2>
        </div>

        {/* 3-column grid */}
        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((item) => (
            <div
              key={item.step}
              className="flex flex-col items-center text-center"
            >
              <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <item.icon className="size-10" />
              </div>
              <span className="mt-6 text-sm font-bold uppercase tracking-widest text-primary">
                {"Step "}
                {item.step}
              </span>
              <h3 className="mt-3 text-balance text-2xl font-bold text-foreground md:text-3xl">
                {item.title}
              </h3>
              <p className="mt-4 max-w-sm text-pretty text-base leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
