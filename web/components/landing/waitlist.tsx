import { Button } from "@/components/ui/button";

export function Waitlist() {
  return (
    <section className="max-w-xl mx-auto px-6 py-20 text-center">
      <h2 className="font-sans text-2xl font-semibold text-foreground mb-3">
        Get early access
      </h2>
      <p className="font-sans text-sm text-muted-foreground mb-8">
        We are rolling out to a small group first. Leave your email and we will
        reach out when your spot is ready.
      </p>

      <form className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="your@email.com"
          className="flex-1 bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-(--sb-text-disabled) outline-none focus:border-primary/60 transition-colors font-sans"
        />
        <Button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans font-medium shrink-0"
        >
          Join waitlist
        </Button>
      </form>
    </section>
  );
}
