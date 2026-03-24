"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, X, Check } from "lucide-react";
import { Grade, DB_GRADE_COLUMNS } from "@/lib/grade";

interface ProfessorGrades {
  id: number;
  name: string;
  public_id: number | null;
  section_count: number;
  [key: string]: any;
}

function computeStats(grades: Record<string, number>) {
  const numericalGrades = Grade.NUMERICAL_GRADES;
  let total = 0;
  let weightedSum = 0;

  for (const letter of numericalGrades) {
    const dbCol = Object.entries(DB_GRADE_COLUMNS).find(([, l]) => l === letter)?.[0];
    if (!dbCol) continue;
    const count = grades[dbCol] || 0;
    total += count;
    weightedSum += count * Grade.value(letter);
  }

  if (total === 0) return null;
  const mean = weightedSum / total;
  const meanLetter = Grade.letter(Math.round(mean));
  return { mean: meanLetter, total };
}

function ComparisonChart({
  selected,
  onRemove,
}: {
  selected: ProfessorGrades[];
  onRemove: (id: number) => void;
}) {
  const numericalGrades = Grade.NUMERICAL_GRADES;
  const colors = [
    "hsl(0, 85%, 45%)",    // raven crimson
    "hsl(220, 80%, 55%)",  // blue
    "hsl(150, 60%, 45%)",  // green
    "hsl(40, 90%, 55%)",   // amber
    "hsl(280, 60%, 55%)",  // purple
  ];

  // Compute percentages for each professor
  const profData = selected.map((prof) => {
    const stats = computeStats(prof);
    const total = stats?.total || 0;
    const pcts = numericalGrades.map((letter) => {
      const dbCol = Object.entries(DB_GRADE_COLUMNS).find(([, l]) => l === letter)?.[0];
      const count = prof[dbCol || ""] || 0;
      return total > 0 ? (count / total) * 100 : 0;
    });
    return { ...prof, pcts, stats };
  });

  const maxPct = Math.max(...profData.flatMap((p) => p.pcts), 1);

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {profData.map((prof, i) => (
          <div
            key={prof.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="font-medium">{prof.name}</span>
            {prof.stats && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${Grade.badgeColor(prof.stats.mean)}`}>
                {prof.stats.mean}
              </span>
            )}
            <span className="text-muted-foreground text-xs">
              {prof.stats?.total.toLocaleString()} students · {prof.section_count} sections
            </span>
            <button
              onClick={() => onRemove(prof.id)}
              className="ml-1 p-0.5 rounded hover:bg-background/50"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="space-y-1">
        {numericalGrades.map((letter, gradeIdx) => (
          <div key={letter} className="flex items-center gap-3">
            <div className="w-8 text-xs font-medium text-right shrink-0">
              {letter}
            </div>
            <div className="flex-1 space-y-0.5">
              {profData.map((prof, profIdx) => (
                <motion.div
                  key={prof.id}
                  className="h-4 rounded-sm relative group"
                  style={{ backgroundColor: colors[profIdx % colors.length] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(prof.pcts[gradeIdx] / maxPct) * 100}%` }}
                  transition={{ duration: 0.5, delay: gradeIdx * 0.03 + profIdx * 0.05 }}
                >
                  <div className="absolute inset-0 flex items-center pl-2 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {prof.pcts[gradeIdx].toFixed(1)}%
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GradeComparison({
  professorGrades,
}: {
  professorGrades: ProfessorGrades[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  if (professorGrades.length < 2) return null;

  const toggleProfessor = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selected = professorGrades.filter((p) => selectedIds.includes(p.id));

  return (
    <div className="mb-8">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && selectedIds.length === 0) {
            // Auto-select first two professors
            setSelectedIds(professorGrades.slice(0, 2).map((p) => p.id));
          }
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:border-raven/50 transition-colors text-sm font-medium"
      >
        <BarChart3 className="w-4 h-4 text-raven" />
        {open ? "Close Comparison" : "Compare Professors"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 sm:p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-semibold mb-4">
                Grade Distribution Comparison
              </h3>

              {/* Professor selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                {professorGrades.map((prof) => {
                  const isSelected = selectedIds.includes(prof.id);
                  return (
                    <button
                      key={prof.id}
                      onClick={() => toggleProfessor(prof.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        isSelected
                          ? "border-raven bg-raven/10 text-foreground"
                          : "border-border bg-secondary text-muted-foreground hover:border-raven/30"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {prof.name}
                    </button>
                  );
                })}
              </div>

              {selected.length >= 2 ? (
                <ComparisonChart
                  selected={selected}
                  onRemove={(id) =>
                    setSelectedIds((prev) => prev.filter((x) => x !== id))
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Select at least 2 professors to compare
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
