
'use client'

import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { CTASection } from '@/components/landing/cta-section'
import { FooterSection } from '@/components/landing/footer-section'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <FooterSection />
    </main>
  )
}
