"use client";

import { useEffect, useRef, useState } from "react";

interface StatProps {
  value: number;
  label: string;
  delay?: number;
}

function AnimatedStat({ value, label, delay = 0 }: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const timer = setTimeout(() => {
      const duration = 1500;
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timer);
  }, [started, value, delay]);

  return (
    <div ref={ref}>
      <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-mono">
        {displayValue.toLocaleString()}
      </div>
      <div className="text-xs text-muted-foreground mt-1 tracking-wider uppercase">
        {label}
      </div>
    </div>
  );
}

interface HeroStatsProps {
  courses: number;
  professors: number;
  subjects: number;
}

export function HeroStats({ courses, professors, subjects }: HeroStatsProps) {
  return (
    <div className="flex items-start gap-10 md:gap-14">
      <AnimatedStat value={courses} label="Courses" delay={200} />
      <AnimatedStat value={professors} label="Professors" delay={400} />
      <AnimatedStat value={subjects} label="Subjects" delay={600} />
    </div>
  );
}
