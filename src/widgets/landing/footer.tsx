import { QrCode } from "lucide-react";
import { Separator } from "@/shared/ui/separator";

const footerLinks = {
  product: {
    title: "제품",
    links: [
      { label: "기능 소개", href: "#features" },
      { label: "요금제", href: "#pricing" },
      { label: "도입 사례", href: "#how-it-works" },
      { label: "API 문서", href: "#" },
    ],
  },
  support: {
    title: "지원",
    links: [
      { label: "고객센터", href: "#" },
      { label: "도입 가이드", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "파트너 프로그램", href: "#" },
    ],
  },
  legal: {
    title: "법적고지",
    links: [
      { label: "이용약관", href: "#" },
      { label: "개인정보처리방침", href: "#" },
      { label: "보안 정책", href: "#" },
    ],
  },
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <a href="#" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <QrCode className="size-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                QR-Order Pro
              </span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {
                "프랜차이즈와 가맹점을 위한 올인원 QR 오더 솔루션. 더 빠르고 스마트한 매장 운영을 시작하세요."
              }
            </p>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-sm font-semibold text-foreground">
                {section.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            {"© 2024 QR-Order Pro. All rights reserved."}
          </p>
          <p className="text-sm text-muted-foreground">
            {"주식회사 큐알오더 | 대표이사: 홍길동 | 사업자등록번호: 123-45-67890"}
          </p>
        </div>
      </div>
    </footer>
  );
}
