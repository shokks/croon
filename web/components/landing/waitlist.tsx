import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Waitlist() {
  return (
    <section id="waitlist" className="border-t border-border bg-card">
      <div className="max-w-xl mx-auto px-6 py-28 sm:py-36 text-center">
      <h2
        className="text-3xl sm:text-4xl font-normal text-foreground mb-4"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Be one of the first.
      </h2>
      <p className="font-sans text-base text-muted-foreground mb-10 max-w-sm mx-auto">
        We're letting in a small group first. You should be one of them.
      </p>

      <form className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="your@email.com"
          className="flex-1 bg-background border-border font-sans"
        />
        <Button
          type="submit"
          size="default"
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium shrink-0"
        >
          Get Early Access
        </Button>
      </form>
      <p className="mt-4 text-xs text-(--sb-text-disabled) font-sans">No spam. Early invites only.</p>
      </div>
    </section>
  );
}
