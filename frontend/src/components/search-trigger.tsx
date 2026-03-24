"use client";

import { Search } from "lucide-react";

export function SearchTrigger() {
  return (
    <button
      onClick={() =>
        document.dispatchEvent(new CustomEvent("open-command-palette"))
      }
      className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 hover:bg-secondary px-4 py-2 rounded-xl border border-border hover:border-border/80 transition-all duration-200 w-full max-w-md"
    >
      <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
      <span className="flex-1 text-left">Search courses, professors...</span>
      <kbd className="text-[10px] text-muted-foreground/60 font-mono shrink-0 hidden sm:block">
        ⌘K
      </kbd>
    </button>
  );
}
