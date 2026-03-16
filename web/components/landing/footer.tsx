import Image from "next/image";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <>
      <Separator className="bg-border max-w-5xl mx-auto" />
      <footer className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="SongBuddy" width={16} height={16} className="invert opacity-50" />
          <span className="font-sans text-sm font-semibold text-foreground">SongBuddy</span>
        </div>
        <span className="font-sans text-xs text-(--sb-text-disabled)">© 2026</span>
      </footer>
    </>
  );
}
