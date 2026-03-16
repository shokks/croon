import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Waitlist() {
  return (
    <section className="max-w-xl mx-auto px-6 py-20 text-center">
      <h2
        className="text-2xl font-normal text-foreground mb-3"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Be first to try SongBuddy
      </h2>
      <p className="font-sans text-sm text-muted-foreground mb-8">
        We are inviting a small group of early users. Drop your email.
      </p>

      <form className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="your@email.com"
          className="flex-1 bg-card border-border font-sans"
        />
        <Button
          type="submit"
          size="default"
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium shrink-0"
        >
          Get Early Access
        </Button>
      </form>
      <p className="mt-3 text-xs text-(--sb-text-disabled) font-sans">No spam. Early invites only.</p>
    </section>
  );
}
