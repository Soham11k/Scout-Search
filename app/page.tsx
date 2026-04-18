import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import {
  FAQ,
  FeaturesSection,
  FinalCTA,
  Hero,
  HowItWorks,
  PressStrip,
  Testimonials,
} from '@/components/marketing-sections'

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="marketing" />
      <main>
        <Hero />
        <PressStrip />
        <FeaturesSection />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  )
}
