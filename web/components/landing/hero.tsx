import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="max-w-3xl mx-auto px-6 pt-24 pb-20 text-center">
      <Badge
        variant="outline"
        className="mb-8 border-(--sb-accent-muted) bg-(--sb-accent-muted) text-primary text-xs tracking-wide font-sans"
      >
        Private beta
      </Badge>

      <h1
        className="text-5xl sm:text-6xl leading-tight font-normal text-foreground mb-6"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Record yourself singing.{" "}
        <span className="text-primary">Share the moment.</span>
      </h1>

      <p className="font-sans text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-10">
        Paste your lyrics, hit record, get a link your friends can open and
        hear. No account. No strangers. No stage.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium cursor-not-allowed opacity-60"
          disabled
        >
          Download for iOS
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-border text-muted-foreground hover:text-foreground hover:border-primary/50 font-sans cursor-not-allowed opacity-60"
          disabled
        >
          Download for Android
        </Button>
      </div>

      <p className="mt-4 text-xs text-(--sb-text-disabled) font-sans">
        Currently in private beta — join the waitlist below
      </p>
    </section>
  );
}
