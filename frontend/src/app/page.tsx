import Link from "next/link";
import { HeroSection } from "@/components/hero/hero-section";
import { ScrollVideoSection } from "@/components/home/scroll-video-section";
import { BrowseSection } from "@/components/home/browse-section";
import { ProfessorsSection } from "@/components/home/professors-section";
import { dbAll, dbGet } from "@/lib/db";
import type { GradeDistribution } from "@/lib/db";

async function getStats() {
  const courses = await dbGet<{ count: number }>("SELECT COUNT(*) as count FROM courses");
  const professors = await dbGet<{ count: number }>("SELECT COUNT(*) as count FROM professors");
  const subjects = await dbGet<{ count: number }>("SELECT COUNT(*) as count FROM subjects");
  return {
    courses: courses?.count || 0,
    professors: professors?.count || 0,
    subjects: subjects?.count || 0,
  };
}

async function getPopularSubjects() {
  const subjects = await dbAll<{ code: string; title: string; faculty: string; course_count: number }>(
    `SELECT s.code, s.title, s.faculty,
      (SELECT COUNT(*) FROM courses c WHERE c.subject_code = s.code) as course_count
     FROM subjects s
     ORDER BY course_count DESC
     LIMIT 12`
  );

  const results = [];
  for (const subject of subjects) {
    const grades = await dbGet<GradeDistribution>(
      `SELECT
        SUM(g.a_plus) as a_plus, SUM(g.a) as a, SUM(g.a_minus) as a_minus,
        SUM(g.b_plus) as b_plus, SUM(g.b) as b, SUM(g.b_minus) as b_minus,
        SUM(g.c_plus) as c_plus, SUM(g.c) as c, SUM(g.c_minus) as c_minus,
        SUM(g.d_plus) as d_plus, SUM(g.d) as d, SUM(g.d_minus) as d_minus,
        SUM(g.f) as f,
        SUM(g.ein) as ein, SUM(g.ns) as ns, SUM(g.nc) as nc,
        SUM(g.abs) as abs, SUM(g.p) as p, SUM(g.s) as s
      FROM course_section_grades g
      JOIN course_sections cs ON cs.id = g.course_section_id
      WHERE cs.subject_code = ?`,
      [subject.code]
    );
    results.push({ ...subject, grades: grades ?? null });
  }
  return results;
}

async function getTopProfessors() {
  return dbAll<{
    id: number;
    name: string;
    public_id: number | null;
    rating: number;
    difficulty: number;
    num_ratings: number;
    would_take_again: number;
    department: string;
  }>(
    `SELECT p.id, p.name, p.public_id,
      r.rating, r.difficulty, r.num_ratings, r.would_take_again, r.department
     FROM professors p
     JOIN rmp_reviews r ON r.professor_id = p.id
     WHERE r.num_ratings >= 20 AND r.rating > 0
     ORDER BY r.rating DESC
     LIMIT 10`
  );
}

export default async function Home() {
  const stats = await getStats();
  const popularSubjects = await getPopularSubjects();
  const topProfessors = await getTopProfessors();

  return (
    <main>
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-14 flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight shrink-0">
            <span className="text-raven">Raven</span>
            <span>Rank</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/subjects" className="hover:text-foreground transition-colors duration-200">
              Subjects
            </Link>
            <Link href="/professors" className="hover:text-foreground transition-colors duration-200">
              Professors
            </Link>
          </nav>
          <div className="flex-1" />
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 shrink-0"
          >
            About
          </Link>
        </div>
      </header>
      <HeroSection stats={stats} />
      <ScrollVideoSection />
      <BrowseSection subjects={popularSubjects} />
      <ProfessorsSection professors={topProfessors} />
    </main>
  );
}
