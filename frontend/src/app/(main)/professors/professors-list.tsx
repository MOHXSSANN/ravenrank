"use client";

import Link from "next/link";
import { useState } from "react";

interface Prof {
  id: number;
  name: string;
  public_id: number | null;
  rating: number | null;
  difficulty: number | null;
  num_ratings: number | null;
  would_take_again: number | null;
  department: string | null;
}

const PAGE_SIZE = 20;

function ratingColor(rating: number): string {
  if (rating >= 4) return "text-green-400";
  if (rating >= 3) return "text-yellow-400";
  if (rating >= 2) return "text-orange-400";
  return "text-red-400";
}

export function ProfessorsList({ professors }: { professors: Prof[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  const shown = professors.slice(0, visible);
  const hasMore = visible < professors.length;

  return (
    <>
      <div className="divide-y divide-border">
        {shown.map((prof) => (
          <Link
            key={prof.id}
            href={`/professor/${prof.public_id || prof.id}`}
            className="flex items-center justify-between py-4 group transition-colors duration-200"
          >
            <div className="min-w-0">
              <div className="font-semibold tracking-tight group-hover:text-raven transition-colors duration-200">
                {prof.name}
              </div>
              {prof.department && (
                <div className="text-sm text-muted-foreground/60 mt-0.5 truncate">
                  {prof.department}
                </div>
              )}
            </div>
            <div className="flex items-center shrink-0 ml-4">
              {prof.rating && prof.rating > 0 ? (
                <>
                  <div className="text-right w-16">
                    <span className={`font-mono font-semibold ${ratingColor(prof.rating)}`}>
                      {prof.rating.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 ml-1">/ 5</span>
                  </div>
                  <div className="text-right w-20 hidden sm:block">
                    {prof.would_take_again != null && prof.would_take_again >= 0 ? (
                      <>
                        <span className="font-mono text-sm text-muted-foreground">
                          {Math.round(prof.would_take_again)}%
                        </span>
                        <span className="text-[10px] text-muted-foreground/40 ml-1">again</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/30">-</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground/40 font-mono w-20 text-right">
                    {prof.num_ratings} ratings
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground/30">No ratings</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="px-6 py-2.5 text-sm font-medium text-muted-foreground bg-secondary/50 hover:bg-secondary border border-border/50 rounded-xl transition-colors duration-200"
          >
            Show more ({(professors.length - visible).toLocaleString()} remaining)
          </button>
        </div>
      )}
    </>
  );
}
