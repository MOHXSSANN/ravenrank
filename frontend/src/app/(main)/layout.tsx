import Link from "next/link";
import { SearchTrigger } from "@/components/search-trigger";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-14 flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight shrink-0">
            <span className="text-raven">Raven</span>
            <span>Rank</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground shrink-0">
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
          <div className="flex-1 flex justify-center px-4">
            <SearchTrigger />
          </div>
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 shrink-0"
          >
            About
          </Link>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-6 md:px-12 py-10 md:py-14">
        {children}
      </main>
    </div>
  );
}
