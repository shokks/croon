import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative max-w-3xl mx-auto px-6 pt-24 pb-20 text-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(155,142,196,0.16) 0%, transparent 70%)",
        }}
      />

      <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
        <Badge
          variant="outline"
          className="mb-8 border-(--sb-accent-muted) bg-(--sb-accent-muted) text-primary text-xs tracking-wide font-sans"
        >
          Early access
        </Badge>
      </div>

      <h1
        className="animate-fade-up text-5xl sm:text-6xl leading-tight font-normal text-foreground mb-6"
        style={{ fontFamily: "var(--font-display)", animationDelay: "80ms" }}
      >
        Record yourself{" "}
        <span className="text-primary">singing any song.</span>
      </h1>

      <p
        className="animate-fade-up font-sans text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-10"
        style={{ animationDelay: "160ms" }}
      >
        Find a song, follow the lyrics on screen, and share the clip with
        friends.
      </p>

      <div
        className="animate-fade-up flex justify-center"
        style={{ animationDelay: "240ms" }}
      >
        <Button
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium"
        >
          Join Waitlist
        </Button>
      </div>
    </section>
  );
}
