import { AudioLines, Search, Share2 } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Search",
    description: "Type the song name and artist.",
    icon: Search,
  },
  {
    number: "02",
    title: "Croon",
    description: "Follow synced lyrics as you sing.",
    icon: AudioLines,
  },
  {
    number: "03",
    title: "Share",
    description: "Save it or send it to someone you love.",
    icon: Share2,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border">
      <div className="max-w-4xl mx-auto px-6 py-20">
      <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground mb-12 text-center">
        How it works
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {STEPS.map((step) => (
          <div key={step.number} className="flex flex-col gap-3">
            <step.icon className="h-6 w-6 text-primary" />
            <h3 className="font-sans text-base font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
