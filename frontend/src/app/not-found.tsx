import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-start justify-center px-6 md:px-12 max-w-[1400px] mx-auto">
      {/* Sad raven SVG */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 120 120"
        fill="none"
        className="mb-8 opacity-40"
      >
        <ellipse cx="60" cy="72" rx="30" ry="25" fill="hsl(220, 10%, 15%)" />
        <circle cx="60" cy="40" r="18" fill="hsl(220, 10%, 12%)" />
        <path d="M78 42 L95 50 L80 48Z" fill="hsl(40, 50%, 30%)" />
        <circle cx="68" cy="36" r="4" fill="white" />
        <circle cx="68" cy="37" r="2" fill="hsl(220, 10%, 20%)" />
        <path d="M70 41 Q71 46 69 48" stroke="hsl(210, 60%, 50%)" strokeWidth="1.5" fill="none" />
        <path d="M35 65 Q20 80 30 95" stroke="hsl(220, 10%, 18%)" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M50 95 L45 105 M50 95 L50 105 M50 95 L55 105" stroke="hsl(40, 40%, 30%)" strokeWidth="2" />
        <path d="M70 95 L65 105 M70 95 L70 105 M70 95 L75 105" stroke="hsl(40, 40%, 30%)" strokeWidth="2" />
      </svg>

      <p className="text-sm font-medium tracking-wider uppercase text-raven mb-3 font-mono">
        404
      </p>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-none mb-3">
        Page not found
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-[45ch]">
        This raven could not find what you were looking for.
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="px-4 py-2.5 rounded-lg bg-raven text-white text-sm font-medium hover:bg-raven/90 transition-colors duration-200"
        >
          Go home
        </Link>
        <Link
          href="/subjects"
          className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50 transition-colors duration-200"
        >
          Browse subjects
        </Link>
      </div>
    </div>
  );
}
