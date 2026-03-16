const STEPS = [
  {
    number: "01",
    title: "Paste your lyrics",
    description:
      "Type, paste, or import lyrics from any song. Add the artist name and it finds the artwork automatically.",
  },
  {
    number: "02",
    title: "Hit record",
    description:
      "Lyrics scroll at your pace while your mic captures the take. Background music keeps playing — no interruptions.",
  },
  {
    number: "03",
    title: "Share the link",
    description:
      "Get a link your friends can tap to hear you — album art, scrolling lyrics, and your voice. No download required.",
  },
];

export function HowItWorks() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <p className="font-sans text-xs uppercase tracking-widest text-(--sb-text-disabled) mb-12 text-center">
        How it works
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {STEPS.map((step) => (
          <div key={step.number} className="flex flex-col gap-3">
            <span className="font-sans text-xs text-primary font-semibold tracking-widest">
              {step.number}
            </span>
            <h3 className="font-sans text-base font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
