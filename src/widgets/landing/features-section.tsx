"use client";

import { Wallet, Layers, Smartphone } from "lucide-react";
import { FeatureSectionItem } from "./feature-section-item";
import {
  CustomerMenuPreview,
  MenuManagementPreview,
  KdsPreview,
} from "./previews";

const features = [
  {
    icon: Wallet,
    badge: "Direct Settlement",
    title: "가맹점 다이렉트 정산으로\n빠른 자금 회전",
    description:
      "플랫폼을 거치지 않고 가맹점 PG로 직접 결제됩니다. 중간 수수료 없이 빠른 정산으로 가맹점의 현금 흐름을 극대화합니다.",
    reverse: false,
    preview: CustomerMenuPreview,
    deviceType: "phone" as const,
  },
  {
    icon: Layers,
    badge: "Hybrid Menu",
    title: "본사 메뉴 + 가맹점 자체 메뉴\n하이브리드 관리",
    description:
      "본사의 마스터 메뉴 위에 가맹점만의 특별한 자체 메뉴를 추가하세요. 브랜드 일관성과 가맹점 자율성, 둘 다 놓치지 않습니다.",
    reverse: true,
    preview: MenuManagementPreview,
    deviceType: "tablet" as const,
  },
  {
    icon: Smartphone,
    badge: "3-Second Order",
    title: "앱 설치 없이\n3초 만에 주문 완료",
    description:
      "고객은 번거로운 앱 설치나 회원가입 없이 카메라로 QR을 스캔하면 즉시 주문과 결제가 가능합니다. 주방에는 실시간으로 전달됩니다.",
    reverse: false,
    preview: KdsPreview,
    deviceType: "tablet" as const,
  },
];

export function FeaturesSection() {
  return (
    <div id="features">
      {features.map((feature) => (
        <FeatureSectionItem key={feature.badge} {...feature} />
      ))}
    </div>
  );
}
