import { ScanLine, MonitorSmartphone, BarChart3 } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: ScanLine,
    title: "고객은 자리에 앉아 QR을 스캔합니다.",
    description:
      "테이블 위의 QR 코드를 카메라로 스캔하면 별도 앱 설치 없이 바로 메뉴를 확인하고 주문할 수 있습니다.",
    imagePosition: "left" as const,
  },
  {
    step: "02",
    icon: MonitorSmartphone,
    title: "가맹점 포스기에 실시간 주문이 울립니다.",
    description:
      "주문 접수 즉시 가맹점 POS 시스템에 알림이 전송되어, 빠르고 정확한 주문 처리가 가능합니다.",
    imagePosition: "right" as const,
  },
  {
    step: "03",
    icon: BarChart3,
    title: "본사는 전국 가맹점 매출을 대시보드로 한눈에 확인합니다.",
    description:
      "실시간 매출 데이터, 인기 메뉴 분석, 가맹점별 성과를 통합 대시보드에서 한 번에 관리하세요.",
    imagePosition: "left" as const,
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-t border-border bg-muted/30 py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {"이용 방법"}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {"간단한 3단계로 시작하세요"}
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            {"QR-Order Pro는 복잡한 설치 없이 빠르게 도입할 수 있습니다."}
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-16 md:gap-24">
          {steps.map((item) => (
            <div
              key={item.step}
              className={`flex flex-col items-center gap-8 md:gap-12 ${
                item.imagePosition === "right"
                  ? "md:flex-row-reverse"
                  : "md:flex-row"
              }`}
            >
              {/* Visual */}
              <div className="flex w-full flex-1 items-center justify-center">
                <div className="relative flex aspect-[4/3] w-full max-w-md items-center justify-center rounded-2xl border border-border bg-card shadow-lg">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex size-20 items-center justify-center rounded-2xl bg-accent text-primary">
                      <item.icon className="size-10" />
                    </div>
                    <span className="text-5xl font-bold text-primary/10">
                      {item.step}
                    </span>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="flex w-full flex-1 flex-col">
                <span className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">
                  {"Step "}
                  {item.step}
                </span>
                <h3 className="mb-4 text-balance text-2xl font-bold text-foreground md:text-3xl">
                  {item.title}
                </h3>
                <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
