import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Nav() {
  return (
    <>
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="SongBuddy" width={20} height={20} className="invert opacity-80" />
          <span className="font-sans font-semibold text-lg tracking-tight">SongBuddy</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-border text-muted-foreground hover:text-foreground hover:border-primary cursor-not-allowed opacity-60"
          disabled
        >
          Coming to App Store
        </Button>
      </nav>
      <Separator className="bg-border" />
    </>
  );
}
