import Link from "next/link";
import { SearchTrigger } from "@/components/search-trigger";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 h-14 flex items-center gap-3 md:gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight shrink-0">
            <span className="text-raven">Raven</span>
            <span>Rank</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-muted-foreground shrink-0">
            <Link href="/" className="hover:text-foreground transition-colors duration-200">
              Home
            </Link>
            <Link href="/subjects" className="hover:text-foreground transition-colors duration-200">
              Subjects
            </Link>
            <Link href="/professors" className="hover:text-foreground transition-colors duration-200">
              Professors
            </Link>
          </nav>
          <div className="flex-1 flex justify-center px-2 md:px-4">
            <SearchTrigger />
          </div>
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 shrink-0 hidden sm:block"
          >
            About
          </Link>
        </div>
        {/* Mobile bottom nav */}
        <div className="sm:hidden border-t border-border flex items-center justify-around text-xs text-muted-foreground">
          <Link href="/" className="flex-1 text-center py-2 hover:text-foreground transition-colors">Home</Link>
          <Link href="/subjects" className="flex-1 text-center py-2 hover:text-foreground transition-colors">Subjects</Link>
          <Link href="/professors" className="flex-1 text-center py-2 hover:text-foreground transition-colors">Professors</Link>
          <Link href="/about" className="flex-1 text-center py-2 hover:text-foreground transition-colors">About</Link>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-4 md:px-12 py-8 md:py-14">
        {children}
      </main>
    </div>
  );
}
