import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Waitlist } from "@/components/landing/waitlist";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <Hero />
        <HowItWorks />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
}
