import { Navbar, Hero, Features, Partners, HowItWorks, Networks, Contracts, CTA, Footer } from '@/components/landing';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <Hero />
      <Partners />
      <Features />
      <HowItWorks />
      <Networks />
      <Contracts />
      <CTA />
      <Footer />
    </main>
  );
}
