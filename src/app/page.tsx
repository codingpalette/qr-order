import {
  Header,
  HeroSection,
  SocialProof,
  FeaturesSection,
  HowItWorksSection,
  CTASection,
  Footer,
} from "@/widgets/landing";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <SocialProof />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}