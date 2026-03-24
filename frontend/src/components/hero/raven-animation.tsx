"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

export function RavenAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring-based eye tracking
  const eyeX = useSpring(mouseX, { stiffness: 80, damping: 25 });
  const eyeY = useSpring(mouseY, { stiffness: 80, damping: 25 });

  // Map mouse position to eye movement range
  const leftEyeX = useTransform(eyeX, [-1, 1], [-3, 3]);
  const leftEyeY = useTransform(eyeY, [-1, 1], [-2, 2]);
  const rightEyeX = useTransform(eyeX, [-1, 1], [-3, 3]);
  const rightEyeY = useTransform(eyeY, [-1, 1], [-2, 2]);

  // Subtle head tilt following cursor
  const headRotate = useTransform(eyeX, [-1, 1], [-3, 3]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      // Normalize to -1 to 1
      const nx = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth / 2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight / 2)));
      mouseX.set(nx);
      mouseY.set(ny);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div ref={containerRef} className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
      <motion.svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-2xl"
      >
        {/* Body */}
        <motion.g
          style={{ rotate: headRotate }}
          animate={{ scale: [1, 1.015, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Main body shape */}
          <ellipse cx="100" cy="115" rx="45" ry="55" fill="#1a1a1a" />
          {/* Chest highlight */}
          <ellipse cx="100" cy="125" rx="28" ry="35" fill="#222" />

          {/* Head */}
          <circle cx="100" cy="60" r="30" fill="#1a1a1a" />

          {/* Beak */}
          <path d="M 100 72 L 112 80 L 100 84 Z" fill="#2a2a2a" stroke="#333" strokeWidth="0.5" />
          <path d="M 100 72 L 88 80 L 100 84 Z" fill="#333" stroke="#333" strokeWidth="0.5" />

          {/* Left Eye - white part */}
          <ellipse cx="88" cy="56" rx="8" ry="6" fill="#fff" opacity="0.95" />
          {/* Left Eye - pupil (tracks cursor) */}
          <motion.circle
            cx="88"
            cy="56"
            r="3.5"
            fill="#c41e1e"
            style={{ x: leftEyeX, y: leftEyeY }}
          />
          <motion.circle
            cx="88"
            cy="56"
            r="1.5"
            fill="#1a1a1a"
            style={{ x: leftEyeX, y: leftEyeY }}
          />

          {/* Right Eye - white part */}
          <ellipse cx="112" cy="56" rx="8" ry="6" fill="#fff" opacity="0.95" />
          {/* Right Eye - pupil (tracks cursor) */}
          <motion.circle
            cx="112"
            cy="56"
            r="3.5"
            fill="#c41e1e"
            style={{ x: rightEyeX, y: rightEyeY }}
          />
          <motion.circle
            cx="112"
            cy="56"
            r="1.5"
            fill="#1a1a1a"
            style={{ x: rightEyeX, y: rightEyeY }}
          />

          {/* Eyebrow details */}
          <path d="M 78 48 Q 88 44, 96 48" stroke="#111" strokeWidth="1.5" fill="none" />
          <path d="M 104 48 Q 112 44, 122 48" stroke="#111" strokeWidth="1.5" fill="none" />

          {/* Left Wing */}
          <motion.path
            d="M 55 100 Q 30 85, 20 60 Q 35 75, 55 90 Z"
            fill="#222"
            animate={{ rotate: [0, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "55px", originY: "100px" }}
          />
          <motion.path
            d="M 55 100 Q 25 90, 10 75 Q 30 85, 55 95 Z"
            fill="#1a1a1a"
            animate={{ rotate: [0, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            style={{ originX: "55px", originY: "100px" }}
          />

          {/* Right Wing */}
          <motion.path
            d="M 145 100 Q 170 85, 180 60 Q 165 75, 145 90 Z"
            fill="#222"
            animate={{ rotate: [0, 3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "145px", originY: "100px" }}
          />
          <motion.path
            d="M 145 100 Q 175 90, 190 75 Q 170 85, 145 95 Z"
            fill="#1a1a1a"
            animate={{ rotate: [0, 2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            style={{ originX: "145px", originY: "100px" }}
          />

          {/* Feet */}
          <path d="M 85 168 L 80 180 M 85 168 L 85 181 M 85 168 L 90 180" stroke="#333" strokeWidth="2" fill="none" />
          <path d="M 115 168 L 110 180 M 115 168 L 115 181 M 115 168 L 120 180" stroke="#333" strokeWidth="2" fill="none" />

          {/* Head tuft/crest */}
          <path d="M 85 35 Q 90 20, 95 32" stroke="#1a1a1a" strokeWidth="2" fill="#1a1a1a" />
          <path d="M 95 33 Q 100 15, 105 33" stroke="#1a1a1a" strokeWidth="2" fill="#1a1a1a" />
          <path d="M 105 35 Q 110 22, 115 35" stroke="#1a1a1a" strokeWidth="2" fill="#1a1a1a" />
        </motion.g>
      </motion.svg>

      {/* Ambient glow behind raven */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-20">
        <div className="w-full h-full rounded-full bg-raven" />
      </div>
    </div>
  );
}
