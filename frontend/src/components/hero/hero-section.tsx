"use client";

import Image from "next/image";
import { HeroSearch } from "./hero-search";
import { HeroStats } from "./hero-stats";

interface HeroSectionProps {
  stats: {
    courses: number;
    professors: number;
    subjects: number;
  };
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="relative min-h-[100dvh] overflow-hidden flex items-center justify-center">
      {/* Video background */}
      <div className="absolute inset-0 -z-20">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/ravennew.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Inward masking gradient — fades video edges into the site background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Top edge */}
        <div className="absolute top-0 left-0 right-0 h-[25%] bg-gradient-to-b from-background to-transparent" />
        {/* Bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-background to-transparent" />
        {/* Left edge */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent w-[30%]" />
        {/* Right edge */}
        <div className="absolute top-0 right-0 bottom-0 bg-gradient-to-l from-background via-transparent to-transparent w-[30%]" />
        {/* Radial vignette for extra blending */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, hsl(var(--background)) 100%)",
          }}
        />
        {/* Overall darkening so text reads well over video */}
        <div className="absolute inset-0 bg-background/50" />
      </div>

      {/* Centered content */}
      <div className="relative z-10 max-w-[800px] mx-auto px-6 text-center">
        <div className="hero-fade-up-delay-1">
          <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5">
            <Image src="/logo.png" alt="RavenRank" width={64} height={64} className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]" />
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              <span className="text-raven">Raven</span>
              <span className="text-foreground">Rank</span>
            </h1>
          </div>
          <p className="mt-4 text-sm sm:text-lg md:text-xl text-foreground/90 leading-relaxed max-w-[55ch] mx-auto drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
            Explore Carleton University grade distributions, professor ratings,
            and course data across {stats.courses.toLocaleString()} courses.
          </p>
        </div>

        {/* Search */}
        <div className="hero-fade-up-delay-2 mt-10">
          <HeroSearch />
        </div>

        {/* Stats */}
        <div className="hero-fade-up-delay-3 mt-14">
          <HeroStats
            courses={stats.courses}
            professors={stats.professors}
            subjects={stats.subjects}
          />
        </div>
      </div>

      {/* Scroll indicator — bottom center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hero-float">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <span className="text-xs tracking-wider uppercase">Scroll</span>
          <div className="w-px h-10 bg-border" />
        </div>
      </div>
    </section>
  );
}
