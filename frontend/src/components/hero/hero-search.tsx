"use client";

import { Search } from "lucide-react";

export function HeroSearch() {
  const openCommandPalette = () => {
    document.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <button
        type="button"
        onClick={openCommandPalette}
        className="relative w-full text-left group"
      >
        <div className="relative rounded-xl transition-shadow duration-300 group-hover:shadow-[0_0_40px_hsl(0,72%,42%,0.15)]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <div className="w-full pl-11 pr-16 py-3.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 text-muted-foreground text-sm cursor-pointer group-hover:border-raven/20 transition-colors duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            Search courses, professors...
          </div>
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50 font-mono bg-secondary/50 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </button>
    </div>
  );
}
