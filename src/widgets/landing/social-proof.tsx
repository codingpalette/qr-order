import {
  Building2,
  Coffee,
  UtensilsCrossed,
  Salad,
  ChefHat,
} from "lucide-react";

const logos = [
  { name: "본사프랜차이즈", icon: Building2 },
  { name: "카페브랜드", icon: Coffee },
  { name: "레스토랑그룹", icon: UtensilsCrossed },
  { name: "샐러드팜", icon: Salad },
  { name: "셰프키친", icon: ChefHat },
];

export function SocialProof() {
  return (
    <section className="border-y border-border bg-muted/50 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-8 text-center text-sm font-medium text-muted-foreground">
          {"이미 수많은 프랜차이즈가 함께하고 있습니다."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center gap-2 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              <logo.icon className="size-6" />
              <span className="text-base font-semibold tracking-tight">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
