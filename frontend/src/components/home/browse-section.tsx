import Link from "next/link";
import { GradeDistribution } from "@/lib/db";
import { Grade, DB_GRADE_COLUMNS, Letter } from "@/lib/grade";

interface SubjectWithGrades {
  code: string;
  title: string;
  faculty: string;
  course_count: number;
  grades: GradeDistribution | null;
}

function computeMean(grades: GradeDistribution | null): { letter: Letter; total: number } | null {
  if (!grades) return null;
  let weightedSum = 0;
  let count = 0;
  for (const [col, letter] of Object.entries(DB_GRADE_COLUMNS)) {
    const val = (grades as any)[col] as number;
    if (val > 0) {
      const numVal = Grade.GRADE_VALUES[letter];
      if (!isNaN(numVal)) {
        weightedSum += numVal * val;
        count += val;
      }
    }
  }
  if (count === 0) return null;
  const mean = weightedSum / count;
  return { letter: Grade.letter(mean), total: count };
}

export function BrowseSection({ subjects }: { subjects: SubjectWithGrades[] }) {
  return (
    <section className="py-24 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
            Browse subjects
          </h2>
          <p className="mt-3 text-muted-foreground max-w-[55ch]">
            Explore grade distributions across all faculties. Pick a subject to see every course and professor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/40">
          {subjects.map((subject) => {
            const stats = computeMean(subject.grades);

            return (
              <Link
                key={subject.code}
                href={`/subject/${subject.code}`}
                className="group bg-background p-6 hover:bg-secondary/30 transition-colors duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm text-raven">
                        {subject.code}
                      </span>
                      <span className="text-xs text-muted-foreground/50 font-mono">
                        {subject.course_count} courses
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground font-medium truncate group-hover:text-raven transition-colors duration-200">
                      {subject.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/60 truncate">
                      {subject.faculty}
                    </p>
                  </div>

                  {stats && (
                    <div className="shrink-0 text-right">
                      <span className={`inline-block text-xs font-mono font-semibold px-2 py-0.5 rounded ${Grade.badgeColor(stats.letter)}`}>
                        {stats.letter}
                      </span>
                      <p className="mt-1 text-[10px] text-muted-foreground/50 font-mono tabular-nums">
                        {stats.total.toLocaleString()} grades
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-raven transition-colors duration-200"
          >
            View all subjects
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
