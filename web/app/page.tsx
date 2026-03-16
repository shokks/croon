import { Separator } from "@/components/ui/separator";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Waitlist } from "@/components/landing/waitlist";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Separator className="bg-border max-w-5xl mx-auto px-6" />
      <HowItWorks />
      <Separator className="bg-border max-w-5xl mx-auto px-6" />
      <Waitlist />
      <Footer />
    </div>
  );
}
