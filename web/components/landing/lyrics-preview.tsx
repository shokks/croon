// 8 lines from a universally recognised song — duplicated for a seamless loop.
// Each line renders at h-12 (48px) so 8 lines = 384px, matching the CSS keyframe.
const LYRICS = [
  "Is this the real life?",
  "Is this just fantasy?",
  "Caught in a landslide,",
  "No escape from reality.",
  "Open your eyes,",
  "Look up to the skies and see,",
  "I'm just a poor boy,",
  "I need no sympathy,",
];

export function LyricsPreview() {
  return (
    <div className="mx-auto max-w-xs rounded-xl border border-border bg-card overflow-hidden">
      {/* Song header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="h-9 w-9 rounded-lg bg-secondary shrink-0 flex items-center justify-center text-primary text-base select-none">
          ♪
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground font-sans truncate leading-tight">
            Bohemian Rhapsody
          </p>
          <p className="text-xs text-muted-foreground font-sans leading-tight">Queen</p>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Recording indicator — matches RecordButton pulse */}
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs text-muted-foreground font-sans tabular-nums">0:42</span>
        </div>
      </div>

      {/*
       * Lyrics window.
       * - lyrics-mask applies the 3-zone CSS mask (past/active/future opacities)
       * - h-48 = 192px = exactly 4 lines of h-12 (48px) visible
       * - Center guide at top-1/2 replicates the 2px accent line from LyricsScrollView
       * - pt-[72px] positions line 1 at the active zone centre (96px - 24px = 72px)
       */}
      <div className="relative h-48 lyrics-mask overflow-hidden">
        {/* 2px center guide — accent @ 0.18 opacity, matching withOpacity(Palette.accent, 0.12) */}
        <div
          className="absolute top-1/2 -translate-y-px inset-x-5 h-0.5 pointer-events-none z-10"
          style={{ backgroundColor: "rgba(155, 142, 196, 0.18)" }}
        />

        {/* Scrolling lyrics — Lora matches the app's teleprompter font */}
        <div className="lyrics-scroll" style={{ paddingTop: "72px" }}>
          {[...LYRICS, ...LYRICS].map((line, i) => (
            <p
              key={i}
              className="h-12 flex items-center px-5 text-xl text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
