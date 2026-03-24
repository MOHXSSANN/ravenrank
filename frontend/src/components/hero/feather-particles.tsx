"use client";

import { useEffect, useRef } from "react";

interface Feather {
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  drift: number;
  phase: number;
  opacity: number;
  color: string;
}

const FEATHER_COLORS = [
  "rgba(30, 30, 30, 0.6)",
  "rgba(196, 30, 30, 0.4)",
  "rgba(50, 50, 50, 0.5)",
  "rgba(80, 20, 20, 0.35)",
];

export function FeatherParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const feathersRef = useRef<Feather[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize feathers
    const createFeather = (): Feather => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight * -0.5,
      size: 4 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
      drift: 0.5 + Math.random() * 1,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.3 + Math.random() * 0.5,
      color: FEATHER_COLORS[Math.floor(Math.random() * FEATHER_COLORS.length)],
    });

    feathersRef.current = Array.from({ length: 20 }, createFeather);

    let time = 0;
    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      ctx.clearRect(0, 0, w, h);
      time += 0.016;

      for (const feather of feathersRef.current) {
        feather.y += feather.speed;
        feather.x += Math.sin(time * feather.drift + feather.phase) * 0.5;
        feather.rotation += 0.01;

        // Fade out near bottom
        const fadeStart = h * 0.7;
        const alpha =
          feather.y > fadeStart
            ? feather.opacity * (1 - (feather.y - fadeStart) / (h - fadeStart))
            : feather.opacity;

        // Reset feather when it goes off screen
        if (feather.y > h + 20) {
          feather.y = -20;
          feather.x = Math.random() * w;
        }

        // Draw feather (elongated ellipse)
        ctx.save();
        ctx.translate(feather.x, feather.y);
        ctx.rotate(feather.rotation);
        ctx.globalAlpha = Math.max(0, alpha);

        ctx.beginPath();
        ctx.ellipse(0, 0, feather.size * 0.3, feather.size, 0, 0, Math.PI * 2);
        ctx.fillStyle = feather.color;
        ctx.fill();

        // Feather spine
        ctx.beginPath();
        ctx.moveTo(0, -feather.size);
        ctx.lineTo(0, feather.size);
        ctx.strokeStyle = feather.color;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.restore();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
