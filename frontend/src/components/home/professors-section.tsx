import Link from "next/link";

interface TopProfessor {
  id: number;
  name: string;
  public_id: number | null;
  rating: number;
  difficulty: number;
  num_ratings: number;
  would_take_again: number;
  department: string;
}

function ratingColor(rating: number): string {
  if (rating >= 4) return "text-green-400";
  if (rating >= 3) return "text-yellow-400";
  if (rating >= 2) return "text-orange-400";
  return "text-red-400";
}

export function ProfessorsSection({ professors }: { professors: TopProfessor[] }) {
  return (
    <section className="py-24 px-6 md:px-12 border-t border-border/30">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
            Top-rated professors
          </h2>
          <p className="mt-3 text-muted-foreground max-w-[55ch]">
            Highest rated Carleton professors on RateMyProfessors, with at least 20 ratings.
          </p>
        </div>

        <div className="divide-y divide-border/40">
          {professors.map((prof, i) => (
            <Link
              key={prof.id}
              href={`/professor/${prof.public_id || prof.id}`}
              className="flex items-center gap-6 py-5 group transition-colors duration-200"
            >
              <span className="text-sm font-mono text-muted-foreground/30 w-6 text-right shrink-0">
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="font-semibold tracking-tight group-hover:text-raven transition-colors duration-200">
                  {prof.name}
                </div>
                <div className="text-sm text-muted-foreground/60 mt-0.5 truncate">
                  {prof.department}
                </div>
              </div>

              <div className="flex items-center gap-8 shrink-0">
                <div className="text-right">
                  <span className={`text-lg font-bold font-mono ${ratingColor(prof.rating)}`}>
                    {prof.rating.toFixed(1)}
                  </span>
                  <div className="text-[10px] text-muted-foreground/40">quality</div>
                </div>

                {prof.would_take_again >= 0 && (
                  <div className="text-right hidden sm:block">
                    <span className="text-lg font-bold font-mono text-foreground">
                      {Math.round(prof.would_take_again)}%
                    </span>
                    <div className="text-[10px] text-muted-foreground/40">take again</div>
                  </div>
                )}

                <div className="text-right hidden md:block">
                  <span className="text-sm font-mono text-muted-foreground">
                    {prof.num_ratings}
                  </span>
                  <div className="text-[10px] text-muted-foreground/40">ratings</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/professors"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-raven transition-colors duration-200"
          >
            View all professors
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
