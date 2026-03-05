import {
  Building2,
  Coffee,
  UtensilsCrossed,
  Salad,
  ChefHat,
  Soup,
  Sandwich,
  CakeSlice,
} from "lucide-react";
import { Marquee } from "./marquee";

const logos = [
  { name: "본사프랜차이즈", icon: Building2 },
  { name: "카페브랜드", icon: Coffee },
  { name: "레스토랑그룹", icon: UtensilsCrossed },
  { name: "샐러드팜", icon: Salad },
  { name: "셰프키친", icon: ChefHat },
  { name: "수프하우스", icon: Soup },
  { name: "샌드위치랩", icon: Sandwich },
  { name: "디저트라운지", icon: CakeSlice },
];

export function SocialProof() {
  return (
    <section className="border-y border-border/50 bg-muted/30 py-10">
      <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
        {"이미 수많은 프랜차이즈가 함께하고 있습니다."}
      </p>
      <Marquee speed={35}>
        {logos.map((logo) => (
          <div
            key={logo.name}
            className="flex shrink-0 items-center gap-2 text-muted-foreground/50 grayscale transition-all hover:text-muted-foreground hover:grayscale-0"
          >
            <logo.icon className="size-6" />
            <span className="text-base font-semibold tracking-tight">
              {logo.name}
            </span>
          </div>
        ))}
      </Marquee>
    </section>
  );
}
