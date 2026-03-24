"use client";

import { useEffect, useRef, useCallback } from "react";

const FRAME_COUNT = 101;
const SCROLL_HEIGHT = "300vh"; // short and snappy

const SECTIONS = [
  {
    title: "Every grade, every section",
    description:
      "Dive into detailed grade distributions across thousands of course sections. See exactly how students performed.",
  },
  {
    title: "Ratings sourced from RateMyProfessors",
    description:
      "Real professor ratings and difficulty scores from RateMyProfessors. 3,300+ Carleton professors with reviews, ratings, and grading patterns, all in one place.",
  },
  {
    title: "Built for Carleton",
    description:
      "Course data sourced from the official Carleton University academic calendar. Updated, accurate, and made for Ravens.",
  },
];

function getFrameSrc(index: number): string {
  const num = String(Math.min(Math.max(index, 1), FRAME_COUNT)).padStart(3, "0");
  return `/frames/frame_${num}.jpg`;
}

export function ScrollVideoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Preload all frames
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);
      images.push(img);
    }
    imagesRef.current = images;

    // Draw first frame once loaded
    images[0].onload = () => drawFrame(0);
  }, []);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size canvas to the viewport (CSS pixels * devicePixelRatio for sharpness)
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.scale(dpr, dpr);
    }

    // Draw with object-fit: cover behavior
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

    if (imgRatio > canvasRatio) {
      // Image is wider — crop sides
      sw = img.naturalHeight * canvasRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      // Image is taller — crop top/bottom
      sh = img.naturalWidth / canvasRatio;
      sy = (img.naturalHeight - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  }, []);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const scrollableDistance = container.offsetHeight - viewportHeight;
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));

        // Map progress to frame index
        const frameIndex = Math.round(progress * (FRAME_COUNT - 1));
        if (frameIndex !== currentFrameRef.current) {
          currentFrameRef.current = frameIndex;
          drawFrame(frameIndex);
        }

        // Update text opacity
        textRefs.current.forEach((el, i) => {
          if (!el) return;
          const zoneStart = i / SECTIONS.length;
          const zoneEnd = (i + 1) / SECTIONS.length;
          const fadeIn = zoneStart + (zoneEnd - zoneStart) * 0.15;
          const fadeOut = zoneEnd - (zoneEnd - zoneStart) * 0.15;

          let opacity = 0;
          let y = 24;

          if (progress >= zoneStart && progress <= zoneEnd) {
            if (progress < fadeIn) {
              const t = (progress - zoneStart) / (fadeIn - zoneStart);
              opacity = t;
              y = 24 * (1 - t);
            } else if (progress > fadeOut) {
              const t = (progress - fadeOut) / (zoneEnd - fadeOut);
              opacity = 1 - t;
              y = -16 * t;
            } else {
              opacity = 1;
              y = 0;
            }
          }

          el.style.opacity = String(opacity);
          el.style.transform = `translateY(${y}px)`;
        });
      });
    };

    const onResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 0; // force re-init on next draw
        canvas.height = 0;
      }
      drawFrame(currentFrameRef.current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [drawFrame]);

  return (
    <div ref={containerRef} className="relative" style={{ height: SCROLL_HEIGHT }}>
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {/* Canvas — renders the current frame */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Vignette masking */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-[18%] bg-gradient-to-b from-background to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[18%] bg-gradient-to-t from-background to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-transparent w-[50%]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 25%, hsl(var(--background)) 100%)",
            }}
          />
        </div>

        {/* Text sections */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 w-full">
            <div className="relative max-w-lg">
              {SECTIONS.map((section, i) => (
                <div
                  key={i}
                  ref={(el) => { textRefs.current[i] = el; }}
                  className="absolute top-0 left-0"
                  style={{
                    opacity: 0,
                    willChange: "transform, opacity",
                  }}
                >
                  <p className="text-xs font-mono tracking-widest uppercase text-raven/70 mb-4">
                    0{i + 1} / 0{SECTIONS.length}
                  </p>
                  <h2 className="text-xl sm:text-3xl md:text-5xl font-bold tracking-tighter leading-none text-foreground">
                    {section.title}
                  </h2>
                  <p className="mt-3 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-[50ch]">
                    {section.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
