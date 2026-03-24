import { getProfessor, getProfessorCourses } from "@/lib/queries";
import { Grade, DB_GRADE_COLUMNS } from "@/lib/grade";
import type { RmpTag } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const professor = await getProfessor(parseInt(params.id));
  if (!professor) return { title: "Professor Not Found" };
  return {
    title: professor.name,
    description: `Grade distributions and ratings for ${professor.name} at Carleton University.`,
  };
}

function computeStats(grades: Record<string, number>) {
  const numericalGrades = Grade.NUMERICAL_GRADES;
  let total = 0;
  let weightedSum = 0;

  for (const letter of numericalGrades) {
    const dbCol = Object.entries(DB_GRADE_COLUMNS).find(([, l]) => l === letter)?.[0];
    if (!dbCol) continue;
    const count = (grades as any)[dbCol] || 0;
    total += count;
    weightedSum += count * Grade.value(letter);
  }

  if (total === 0) return null;
  const mean = weightedSum / total;
  const meanLetter = Grade.letter(Math.round(mean));

  return { mean: meanLetter, total };
}

function parseTags(tagsJson: string | null | undefined): RmpTag[] {
  if (!tagsJson) return [];
  try {
    return JSON.parse(tagsJson);
  } catch {
    return [];
  }
}

function ratingColor(rating: number): string {
  if (rating >= 4) return "text-green-400";
  if (rating >= 3) return "text-yellow-400";
  if (rating >= 2) return "text-orange-400";
  return "text-red-400";
}

function difficultyColor(diff: number): string {
  if (diff <= 2) return "text-green-400";
  if (diff <= 3) return "text-yellow-400";
  if (diff <= 4) return "text-orange-400";
  return "text-red-400";
}

export default async function ProfessorPage({ params }: { params: { id: string } }) {
  const professor = await getProfessor(parseInt(params.id));
  if (!professor) notFound();

  const courses = await getProfessorCourses(professor.id);
  const rmp = professor.rmpReview;
  const tags = parseTags(rmp?.tags);
  const wouldTakeAgain = rmp?.would_take_again;

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-none">
          {professor.name}
        </h1>
        {rmp?.department && (
          <p className="mt-2 text-muted-foreground">{rmp.department}</p>
        )}
      </div>

      {/* RMP Stats */}
      {rmp && (
        <div className="mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40 rounded-xl overflow-hidden border border-border/40">
            {/* Quality / Rating */}
            <div className="bg-background p-5">
              <div className={`text-3xl font-bold font-mono tracking-tight ${ratingColor(rmp.rating || 0)}`}>
                {rmp.rating?.toFixed(1) || "N/A"}
              </div>
              <div className="text-xs text-muted-foreground tracking-wider uppercase mt-1">
                Quality
              </div>
              <div className="text-[10px] text-muted-foreground/50 mt-0.5">out of 5</div>
            </div>

            {/* Difficulty */}
            <div className="bg-background p-5">
              <div className={`text-3xl font-bold font-mono tracking-tight ${difficultyColor(rmp.difficulty || 0)}`}>
                {rmp.difficulty?.toFixed(1) || "N/A"}
              </div>
              <div className="text-xs text-muted-foreground tracking-wider uppercase mt-1">
                Difficulty
              </div>
              <div className="text-[10px] text-muted-foreground/50 mt-0.5">out of 5</div>
            </div>

            {/* Would Take Again */}
            <div className="bg-background p-5">
              <div className={`text-3xl font-bold font-mono tracking-tight ${
                wouldTakeAgain && wouldTakeAgain >= 0
                  ? wouldTakeAgain >= 70 ? "text-green-400" : wouldTakeAgain >= 50 ? "text-yellow-400" : "text-red-400"
                  : "text-muted-foreground"
              }`}>
                {wouldTakeAgain && wouldTakeAgain >= 0
                  ? `${Math.round(wouldTakeAgain)}%`
                  : "N/A"}
              </div>
              <div className="text-xs text-muted-foreground tracking-wider uppercase mt-1">
                Would take again
              </div>
            </div>

            {/* Number of Ratings */}
            <div className="bg-background p-5">
              <div className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {rmp.num_ratings || 0}
              </div>
              <div className="text-xs text-muted-foreground tracking-wider uppercase mt-1">
                Ratings
              </div>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-medium tracking-wider uppercase text-muted-foreground/60 mb-3">
                Professor tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags
                  .sort((a, b) => b.count - a.count)
                  .map((tag) => (
                    <span
                      key={tag.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/30 text-sm"
                    >
                      <span className="text-foreground">{tag.name}</span>
                      <span className="text-[10px] text-muted-foreground/50 font-mono">
                        {tag.count}
                      </span>
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Link to RMP */}
          {rmp.link && (
            <div className="mt-4">
              <a
                href={rmp.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-raven transition-colors duration-200"
              >
                View on RateMyProfessors
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Courses */}
      <h2 className="text-sm font-medium tracking-wider uppercase text-muted-foreground mb-6">
        Courses ({courses.length})
      </h2>
      <div className="divide-y divide-border">
        {courses.map((course: any) => {
          const stats = computeStats(course);
          const displayCode = course.code.replace(/(\D+)(\d+)/, "$1 $2");
          return (
            <Link
              key={course.code}
              href={`/course/${course.code}`}
              className="flex items-center justify-between py-5 group transition-colors duration-200"
            >
              <div>
                <div className="font-semibold tracking-tight group-hover:text-raven transition-colors duration-200">
                  {displayCode}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {course.title}
                </div>
              </div>
              {stats && (
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${Grade.badgeColor(stats.mean)}`}>
                    Avg: {stats.mean}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {stats.total.toLocaleString()} students
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
