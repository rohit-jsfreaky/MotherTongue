import { HeroSection } from "@/components/landing/HomeHero";
import {
  AudienceHeading,
  CanvasSection,
  CTABannerSection,
  FaqSection,
  HelpsSection,
  HomeSlidesSection,
  LogoSection,
  MemorySection,
  NumbersSection,
  PricingSection,
  ProductCardsRow,
  ReviewSection,
  SiteFooter,
  ToolkitSection,
} from "@/components/landing/HomeSections";

export default function Home() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white">
      <HeroSection after={<ProductCardsRow />} />
      <HomeSlidesSection />
      <LogoSection />
      <CanvasSection />
      <AudienceHeading />
      <ReviewSection />
      <MemorySection />
      <ToolkitSection />
      <PricingSection />
      <HelpsSection />
      <NumbersSection />
      <FaqSection />
      <CTABannerSection />
      <SiteFooter />
    </div>
  );
}
