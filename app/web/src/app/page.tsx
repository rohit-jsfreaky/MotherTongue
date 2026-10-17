import { Hero } from "@/components/landing/Hero";
import {
  AdMarquee,
  BigMarquee,
  CenterHeading,
  CtaBand,
  Faq,
  GradientBanner,
  HowItHelps,
  Languages,
  MemorySplit,
  PricingBand,
  ProductCards,
  ReviewSplit,
  SiteFooter,
  StatsCard,
  Toolkit,
} from "@/components/landing/Sections";

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <BigMarquee />
        <ProductCards />
        <AdMarquee />
        <Languages />
        <GradientBanner />
        <CenterHeading />
        <ReviewSplit />
        <MemorySplit />
        <Toolkit />
        <PricingBand />
        <HowItHelps />
        <StatsCard />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
