import { getSubject, getSubjectCourses } from "@/lib/queries";
import { Grade, DB_GRADE_COLUMNS } from "@/lib/grade";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const subject = await getSubject(params.code);
  if (!subject) return { title: "Subject Not Found" };
  return {
    title: `${subject.code} - ${subject.title}`,
    description: `Browse courses and grade distributions for ${subject.title} (${subject.code}) at Carleton University.`,
  };
}

function computeStats(grades: Record<string, number> | undefined) {
  if (!grades) return null;
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

export default async function SubjectPage({ params }: { params: { code: string } }) {
  const subject = await getSubject(params.code);
  if (!subject) notFound();

  const courses = await getSubjectCourses(params.code);

  return (
    <div>
      <div className="mb-12">
        <p className="text-sm font-medium tracking-wider uppercase text-raven mb-3">
          {subject.code}
        </p>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tighter leading-none">
          {subject.title}
        </h1>
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          {subject.school && <span>{subject.school}</span>}
          {subject.faculty && <span>{subject.faculty}</span>}
        </div>
        <p className="text-sm text-muted-foreground mt-3 font-mono">
          {courses.length} courses
        </p>
      </div>

      {/* Course list — divide-y rows, not stacked cards */}
      <div className="divide-y divide-border">
        {courses.map((course) => {
          const stats = computeStats(course.grades as any);
          return (
            <Link
              key={course.code}
              href={`/course/${course.code}`}
              className="flex items-center justify-between py-4 sm:py-5 gap-3 group transition-colors duration-200"
            >
              <div className="min-w-0">
                <div className="font-semibold tracking-tight group-hover:text-raven transition-colors duration-200">
                  {course.code.replace(/(\D+)(\d+)/, "$1 $2")}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5 truncate">
                  {course.title}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {stats && (
                  <>
                    <span
                      className={`px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium ${Grade.badgeColor(stats.mean)}`}
                    >
                      {stats.mean}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                      {stats.total.toLocaleString()} students
                    </span>
                  </>
                )}
                <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                  {course.credits} cr
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
