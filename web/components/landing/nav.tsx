import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Nav() {
  return (
    <>
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Croon" width={20} height={20} className="invert opacity-80" />
          <span className="font-sans font-semibold text-lg tracking-tight">Croon</span>
        </div>
        <div className="hidden sm:flex items-center gap-5 text-sm font-sans text-muted-foreground">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium">
          Join Waitlist
        </Button>
      </nav>
      <Separator className="bg-border" />
    </>
  );
}
