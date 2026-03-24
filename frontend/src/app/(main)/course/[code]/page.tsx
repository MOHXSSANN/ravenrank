import {
  getCourse,
  getCourseAggregateGrades,
  getCourseProfessors,
  getCourseProfessorGrades,
  getCourseSections,
} from "@/lib/queries";
import { getSubject } from "@/lib/queries";
import { Grade, DB_GRADE_COLUMNS } from "@/lib/grade";
import { termIdToString } from "@/lib/utils";
import { GradeComparison } from "@/components/grade-comparison";
import { GradeHistogram } from "@/components/grade-histogram";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const course = await getCourse(params.code);
  if (!course) return { title: "Course Not Found" };
  const displayCode = course.code.replace(/(\D+)(\d+)/, "$1 $2");
  return {
    title: `${displayCode} - ${course.title}`,
    description: `Grade distribution and professor ratings for ${displayCode} (${course.title}) at Carleton University.`,
  };
}

function GradeBar({ grades }: { grades: Record<string, number> }) {
  const numericalGrades = Grade.NUMERICAL_GRADES;
  const total = numericalGrades.reduce((sum, letter) => {
    const dbCol = Object.entries(DB_GRADE_COLUMNS).find(([, l]) => l === letter)?.[0];
    return sum + ((grades as any)[dbCol || ""] || 0);
  }, 0);

  if (total === 0) return null;

  return (
    <div className="w-full h-5 rounded-full overflow-hidden flex grade-gradient opacity-75">
      {numericalGrades.map((letter) => {
        const dbCol = Object.entries(DB_GRADE_COLUMNS).find(([, l]) => l === letter)?.[0];
        const count = (grades as any)[dbCol || ""] || 0;
        const pct = (count / total) * 100;
        if (pct === 0) return null;
        return (
          <div
            key={letter}
            className="h-full relative"
            style={{ width: `${pct}%` }}
            title={`${letter}: ${count} (${pct.toFixed(1)}%)`}
          />
        );
      })}
    </div>
  );
}

function computeStats(grades: Record<string, number>) {
  const numericalGrades = Grade.NUMERICAL_GRADES;
  let total = 0;
  let weightedSum = 0;
  const counts: number[] = [];

  for (const letter of numericalGrades) {
    const dbCol = Object.entries(DB_GRADE_COLUMNS).find(([, l]) => l === letter)?.[0];
    if (!dbCol) continue;
    const count = (grades as any)[dbCol] || 0;
    counts.push(count);
    total += count;
    weightedSum += count * Grade.value(letter);
  }

  if (total === 0) return null;

  const mean = weightedSum / total;
  const meanLetter = Grade.letter(Math.round(mean));

  let maxCount = 0;
  let modeIdx = 0;
  counts.forEach((c, i) => {
    if (c > maxCount) {
      maxCount = c;
      modeIdx = i;
    }
  });
  const modeLetter = numericalGrades[modeIdx];

  return { mean: meanLetter, mode: modeLetter, total };
}

export default async function CoursePage({ params }: { params: { code: string } }) {
  const course = await getCourse(params.code);
  if (!course) notFound();

  const [subject, aggregateGrades, sections, professors, professorGrades] = await Promise.all([
    getSubject(course.subject_code),
    getCourseAggregateGrades(params.code),
    getCourseSections(params.code),
    getCourseProfessors(params.code),
    getCourseProfessorGrades(params.code),
  ]);

  const stats = aggregateGrades ? computeStats(aggregateGrades as any) : null;
  const displayCode = course.code.replace(/(\D+)(\d+)/, "$1 $2");

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        {subject && (
          <Link
            href={`/subject/${subject.code}`}
            className="text-sm text-muted-foreground hover:text-raven transition-colors duration-200"
          >
            {subject.title} ({subject.code})
          </Link>
        )}
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-none mt-2">
          {displayCode}
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-[65ch]" style={{ textWrap: "balance" } as any}>
          {course.title}
        </p>
        <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
          <span className="font-mono">{course.credits} credits</span>
          {stats && (
            <span className="font-mono">{stats.total.toLocaleString()} students</span>
          )}
        </div>
      </div>

      {/* Two-column layout: grades left, info right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 mb-12">
        {/* Left: Grade distribution */}
        <div>
          {stats && aggregateGrades && (
            <div className="mb-10">
              <h2 className="text-sm font-medium tracking-wider uppercase text-muted-foreground mb-6">
                Grade distribution
              </h2>
              <GradeHistogram grades={aggregateGrades as any} height={240} />
              <div className="flex items-center gap-4 mt-5">
                <span className={`px-2.5 py-1 rounded-md text-sm font-medium ${Grade.badgeColor(stats.mean)}`}>
                  Mean: {stats.mean}
                </span>
                <span className={`px-2.5 py-1 rounded-md text-sm font-medium ${Grade.badgeColor(stats.mode)}`}>
                  Mode: {stats.mode}
                </span>
              </div>
            </div>
          )}

          {/* Grade Comparison */}
          <GradeComparison professorGrades={professorGrades as any[]} />
        </div>

        {/* Right: Course info sidebar */}
        <aside className="space-y-6">
          {course.description && (
            <div>
              <h3 className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-2">
                Description
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {course.description}
              </p>
            </div>
          )}
          {course.prerequisites && (
            <div className="pt-4 border-t border-border">
              <h3 className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-2">
                Prerequisites
              </h3>
              <p className="text-sm text-foreground/80">{course.prerequisites}</p>
            </div>
          )}
          {course.precludes && (
            <div className="pt-4 border-t border-border">
              <h3 className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-2">
                Precludes
              </h3>
              <p className="text-sm text-foreground/80">{course.precludes}</p>
            </div>
          )}
          {course.components && (
            <div className="pt-4 border-t border-border">
              <h3 className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-2">
                Components
              </h3>
              <p className="text-sm text-foreground/80">{course.components}</p>
            </div>
          )}
        </aside>
      </div>

      {/* Professors — asymmetric 2-column grid, not 3 */}
      {professors.length > 0 && (
        <div className="mb-12">
          <h2 className="text-sm font-medium tracking-wider uppercase text-muted-foreground mb-6">
            Professors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden">
            {professors.map((prof: any) => (
              <Link
                key={prof.id}
                href={`/professor/${prof.public_id || prof.id}`}
                className="p-5 bg-card hover:bg-secondary/50 transition-colors duration-200"
              >
                <div className="font-semibold tracking-tight">{prof.name}</div>
                {prof.rating && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-mono">
                    <span>{prof.rating}/5 rating</span>
                    <span>{prof.difficulty}/5 difficulty</span>
                    <span>{prof.num_ratings} reviews</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sections by term — use border-t dividers, not cards */}
      <div>
        <h2 className="text-sm font-medium tracking-wider uppercase text-muted-foreground mb-6">
          Sections ({sections.length})
        </h2>
        <div className="divide-y divide-border">
          {sections.map((section: any) => {
            const sectionStats = section.grades ? computeStats(section.grades) : null;
            return (
              <div key={section.id} className="py-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium tracking-tight">
                      {termIdToString(section.term_id)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Section {section.section}
                    </span>
                    {section.professors?.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {section.professors.map((p: any) => p.name).join(", ")}
                      </span>
                    )}
                  </div>
                  {sectionStats && (
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${Grade.badgeColor(sectionStats.mean)}`}>
                        {sectionStats.mean}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {sectionStats.total} students
                      </span>
                    </div>
                  )}
                </div>
                {section.grades && <GradeBar grades={section.grades} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
