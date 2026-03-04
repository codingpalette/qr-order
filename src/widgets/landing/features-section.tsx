import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Wallet, Layers, Smartphone } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "가맹점 다이렉트 정산",
    description:
      "플랫폼을 거치지 않고 가맹점 PG로 직접 결제되어 자금 회전이 빠릅니다.",
  },
  {
    icon: Layers,
    title: "하이브리드 메뉴 관리",
    description:
      "본사의 마스터 메뉴에 가맹점만의 특별한 자체 메뉴를 추가해 매출을 극대화하세요.",
  },
  {
    icon: Smartphone,
    title: "앱 설치 없는 3초 주문",
    description:
      "고객은 번거로운 앱 설치나 회원가입 없이 카메라 스캔만으로 즉시 주문과 결제가 가능합니다.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {"핵심 기능"}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {"효율적인 매장 운영을 위한 모든 것"}
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            {
              "프랜차이즈 본사부터 가맹점까지, 모두가 만족하는 통합 QR 오더 시스템"
            }
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/60 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardHeader>
                <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="size-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
