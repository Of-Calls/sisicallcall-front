import { CTA } from "@/components/landing/cta"
import { Features } from "@/components/landing/features"
import { Hero } from "@/components/landing/hero"
import { Logos } from "@/components/landing/logos"
import { Pricing } from "@/components/landing/pricing"
import { Stats } from "@/components/landing/stats"

export function LandingPage() {
  return (
    <>
      <Hero />
      <Logos />
      <Features />
      <Stats />
      <Pricing />
      <CTA />
    </>
  )
}
