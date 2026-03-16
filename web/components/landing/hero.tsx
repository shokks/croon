import { LyricsPreview } from "@/components/landing/lyrics-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative max-w-5xl mx-auto px-6 pt-20 pb-20 overflow-hidden">
      {/* Glow anchored toward the left column */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 25% 45%, rgba(155,142,196,0.14) 0%, transparent 70%)",
        }}
      />

      <div className="flex flex-col md:flex-row md:items-center gap-10 md:gap-16">
        {/* Left: copy + CTA */}
        <div className="flex-1 text-center md:text-left">
          <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
            <Badge
              variant="outline"
              className="mb-6 border-(--sb-accent-muted) bg-(--sb-accent-muted) text-primary text-xs tracking-wide font-sans"
            >
              Early access
            </Badge>
          </div>

          <h1
            className="animate-fade-up text-5xl sm:text-6xl lg:text-7xl leading-tight font-normal text-foreground mb-5"
            style={{
              fontFamily: "var(--font-display)",
              animationDelay: "80ms",
            }}
          >
            Just <span className="text-primary">sing.</span>
          </h1>

          <p
            className="animate-fade-up font-sans text-lg text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto md:mx-0"
            style={{ animationDelay: "160ms" }}
          >
            Search any song. Lyrics on screen. Hit record.
          </p>

          <div
            className="animate-fade-up flex justify-center md:justify-start"
            style={{ animationDelay: "240ms" }}
          >
            <a href="#waitlist">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium"
              >
                Join Waitlist
              </Button>
            </a>
          </div>
        </div>

        {/* Right: animated lyrics preview */}
        <div
          className="animate-fade-up shrink-0"
          style={{ animationDelay: "200ms" }}
        >
          <LyricsPreview />
        </div>
      </div>
    </section>
  );
}
