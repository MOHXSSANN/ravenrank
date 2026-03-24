"use client";

import { motion } from "framer-motion";
import { Grade, DB_GRADE_COLUMNS } from "@/lib/grade";
import { useState } from "react";

interface GradeHistogramProps {
  grades: Record<string, number>;
  height?: number;
}

export function GradeHistogram({ grades, height = 200 }: GradeHistogramProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const numericalGrades = Grade.NUMERICAL_GRADES;

  const data = numericalGrades.map((letter) => {
    const dbCol = Object.entries(DB_GRADE_COLUMNS).find(([, l]) => l === letter)?.[0];
    const count = (grades as any)[dbCol || ""] || 0;
    return { letter, count };
  });

  const total = data.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  if (total === 0) return null;

  return (
    <div className="w-full">
      <div
        className="flex items-end gap-1 w-full"
        style={{ height }}
      >
        {data.map((d, i) => {
          const barHeight = (d.count / maxCount) * height;
          const pct = ((d.count / total) * 100).toFixed(1);
          const isHovered = hoveredIdx === i;

          return (
            <div
              key={d.letter}
              className="flex-1 flex flex-col items-center justify-end relative"
              style={{ height }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-10 z-10 px-2 py-1 rounded bg-foreground text-background text-xs font-medium whitespace-nowrap"
                >
                  {d.count.toLocaleString()} ({pct}%)
                </motion.div>
              )}

              {/* Bar */}
              <motion.div
                className="w-full rounded-t cursor-pointer transition-opacity"
                style={{
                  backgroundColor: Grade.barColor(d.letter),
                  opacity: hoveredIdx === null || isHovered ? 1 : 0.5,
                }}
                initial={{ height: 0 }}
                animate={{ height: barHeight }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-1 mt-1">
        {data.map((d) => (
          <div
            key={d.letter}
            className="flex-1 text-center text-[10px] text-muted-foreground"
          >
            {d.letter}
          </div>
        ))}
      </div>
    </div>
  );
}
