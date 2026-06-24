"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

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
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return professors;
    return professors.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.department && p.department.toLowerCase().includes(q))
    );
  }, [professors, query]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setVisible(PAGE_SIZE);
  }

  return (
    <>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or department…"
          value={query}
          onChange={handleSearch}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-raven/50"
        />
        {query && (
          <p className="mt-2 text-xs text-muted-foreground">
            {filtered.length.toLocaleString()} result{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
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
                    <span className="text-xs text-muted-foreground">
                      {prof.num_ratings?.toLocaleString()} ratings
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground/40 w-36 text-right hidden sm:block">
                  No ratings yet
                </div>
              )}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-muted-foreground text-sm">No professors found.</p>
        )}
      </div>
      {hasMore && (
        <button
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="mt-6 w-full rounded-lg border border-border py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors duration-200"
        >
          Load more ({filtered.length - visible} remaining)
        </button>
      )}
    </>
  );
}
