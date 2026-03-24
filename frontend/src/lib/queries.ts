import { getDb } from "./db";
import type {
  Course,
  GradeDistribution,
  Professor,
  RmpReview,
  Subject,
} from "./db";

// ─── Subjects ───

export function getAllSubjects(): Subject[] {
  return getDb().prepare("SELECT * FROM subjects ORDER BY code").all() as Subject[];
}

export function getSubject(code: string): Subject | undefined {
  return getDb()
    .prepare("SELECT * FROM subjects WHERE code = ?")
    .get(code.toUpperCase()) as Subject | undefined;
}

export function getSubjectCourses(subjectCode: string) {
  const db = getDb();
  const courses = db
    .prepare("SELECT * FROM courses WHERE subject_code = ? ORDER BY code")
    .all(subjectCode.toUpperCase()) as Course[];

  // Get aggregate grades per course
  return courses.map((course) => {
    const grades = db
      .prepare(
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
        WHERE cs.course_code = ?`
      )
      .get(course.code) as GradeDistribution | undefined;

    return { ...course, grades };
  });
}

// ─── Courses ───

export function getCourse(code: string): Course | undefined {
  return getDb()
    .prepare("SELECT * FROM courses WHERE code = ?")
    .get(code.toUpperCase()) as Course | undefined;
}

export function getCourseSections(courseCode: string) {
  const db = getDb();
  const sections = db
    .prepare(
      `SELECT cs.*, g.*
       FROM course_sections cs
       LEFT JOIN course_section_grades g ON g.course_section_id = cs.id
       WHERE cs.course_code = ?
       ORDER BY cs.term_id DESC, cs.section`
    )
    .all(courseCode.toUpperCase());

  return sections.map((row: any) => {
    const professors = db
      .prepare(
        `SELECT p.* FROM professors p
         JOIN course_section_professors csp ON csp.professor_id = p.id
         WHERE csp.course_section_id = ?`
      )
      .all(row.id) as Professor[];

    return {
      id: row.id,
      course_code: row.course_code,
      subject_code: row.subject_code,
      term_id: row.term_id,
      section: row.section,
      professors,
      grades: {
        a_plus: row.a_plus,
        a: row.a,
        a_minus: row.a_minus,
        b_plus: row.b_plus,
        b: row.b,
        b_minus: row.b_minus,
        c_plus: row.c_plus,
        c: row.c,
        c_minus: row.c_minus,
        d_plus: row.d_plus,
        d: row.d,
        d_minus: row.d_minus,
        f: row.f,
        ein: row.ein,
        ns: row.ns,
        nc: row.nc,
        abs: row.abs,
        p: row.p,
        s: row.s,
      } as GradeDistribution,
    };
  });
}

export function getCourseAggregateGrades(courseCode: string): GradeDistribution | undefined {
  return getDb()
    .prepare(
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
      WHERE cs.course_code = ?`
    )
    .get(courseCode.toUpperCase()) as GradeDistribution | undefined;
}

export function getCourseProfessors(courseCode: string) {
  const db = getDb();
  const code = courseCode.toUpperCase();

  // Get professors from section assignments
  const sectionProfs = db
    .prepare(
      `SELECT DISTINCT p.*, rmp.rating, rmp.difficulty, rmp.num_ratings, rmp.department as rmp_department
       FROM professors p
       JOIN course_section_professors csp ON csp.professor_id = p.id
       JOIN course_sections cs ON cs.id = csp.course_section_id
       LEFT JOIN rmp_reviews rmp ON rmp.professor_id = p.id
       WHERE cs.course_code = ?
       ORDER BY p.name`
    )
    .all(code) as any[];

  const seenIds = new Set(sectionProfs.map((p: any) => p.id));

  // Also find professors who list this course in RMP courses_taught
  const rmpProfs = db
    .prepare(
      `SELECT p.*, rmp.rating, rmp.difficulty, rmp.num_ratings, rmp.department as rmp_department
       FROM professors p
       JOIN rmp_reviews rmp ON rmp.professor_id = p.id
       WHERE rmp.courses_taught LIKE ?
       ORDER BY p.name`
    )
    .all(`%${code}%`) as any[];

  for (const prof of rmpProfs) {
    if (seenIds.has(prof.id)) continue;
    // Verify the course code actually matches (not a substring)
    try {
      const taught: { name: string }[] = JSON.parse(prof.courses_taught || "[]");
      const matches = taught.some((t) => {
        const cname = t.name.toUpperCase().trim();
        return cname === code || cname.replace(/[A-Z]$/, "") === code || cname.split("OR").includes(code);
      });
      if (matches) {
        seenIds.add(prof.id);
        sectionProfs.push(prof);
      }
    } catch { /* ignore */ }
  }

  return sectionProfs.sort((a: any, b: any) => a.name.localeCompare(b.name));
}

export function getCourseProfessorGrades(courseCode: string) {
  const db = getDb();
  const code = courseCode.toUpperCase();

  // Get professors with grade data from section assignments
  const sectionProfs = db
    .prepare(
      `SELECT p.id, p.name, p.public_id,
        SUM(g.a_plus) as a_plus, SUM(g.a) as a, SUM(g.a_minus) as a_minus,
        SUM(g.b_plus) as b_plus, SUM(g.b) as b, SUM(g.b_minus) as b_minus,
        SUM(g.c_plus) as c_plus, SUM(g.c) as c, SUM(g.c_minus) as c_minus,
        SUM(g.d_plus) as d_plus, SUM(g.d) as d, SUM(g.d_minus) as d_minus,
        SUM(g.f) as f,
        SUM(g.ein) as ein, SUM(g.ns) as ns, SUM(g.nc) as nc,
        SUM(g.abs) as abs, SUM(g.p) as p, SUM(g.s) as s,
        COUNT(DISTINCT cs.id) as section_count
       FROM professors p
       JOIN course_section_professors csp ON csp.professor_id = p.id
       JOIN course_sections cs ON cs.id = csp.course_section_id
       LEFT JOIN course_section_grades g ON g.course_section_id = cs.id
       WHERE cs.course_code = ?
       GROUP BY p.id
       ORDER BY p.name`
    )
    .all(code) as any[];

  const seenIds = new Set(sectionProfs.map((p: any) => p.id));

  // Also include professors from RMP courses_taught who aren't in sections
  const rmpProfs = db
    .prepare(
      `SELECT p.id, p.name, p.public_id, rmp.courses_taught
       FROM professors p
       JOIN rmp_reviews rmp ON rmp.professor_id = p.id
       WHERE rmp.courses_taught LIKE ?`
    )
    .all(`%${code}%`) as any[];

  for (const prof of rmpProfs) {
    if (seenIds.has(prof.id)) continue;
    try {
      const taught: { name: string }[] = JSON.parse(prof.courses_taught || "[]");
      const matches = taught.some((t) => {
        const cname = t.name.toUpperCase().trim();
        return cname === code || cname.replace(/[A-Z]$/, "") === code || cname.split("OR").includes(code);
      });
      if (matches) {
        seenIds.add(prof.id);
        sectionProfs.push({
          id: prof.id, name: prof.name, public_id: prof.public_id,
          a_plus: 0, a: 0, a_minus: 0, b_plus: 0, b: 0, b_minus: 0, c_plus: 0, c: 0, c_minus: 0,
          d_plus: 0, d: 0, d_minus: 0, f: 0, ein: 0, ns: 0, nc: 0, abs: 0, p: 0, s: 0,
          section_count: 0,
        });
      }
    } catch { /* ignore */ }
  }

  return sectionProfs.sort((a: any, b: any) => a.name.localeCompare(b.name));
}

// ─── Professors ───

export function getProfessor(id: number) {
  const db = getDb();
  const professor = db
    .prepare("SELECT * FROM professors WHERE id = ? OR public_id = ?")
    .get(id, id) as Professor | undefined;

  if (!professor) return undefined;

  const rmpReview = db
    .prepare("SELECT * FROM rmp_reviews WHERE professor_id = ?")
    .get(professor.id) as RmpReview | undefined;

  return { ...professor, rmpReview };
}

export function getProfessorCourses(professorId: number) {
  const db = getDb();

  // Get courses from section assignments (with grade data)
  const sectionCourses = db
    .prepare(
      `SELECT DISTINCT c.code, c.title, c.credits, c.subject_code,
        SUM(g.a_plus) as a_plus, SUM(g.a) as a, SUM(g.a_minus) as a_minus,
        SUM(g.b_plus) as b_plus, SUM(g.b) as b, SUM(g.b_minus) as b_minus,
        SUM(g.c_plus) as c_plus, SUM(g.c) as c, SUM(g.c_minus) as c_minus,
        SUM(g.d_plus) as d_plus, SUM(g.d) as d, SUM(g.d_minus) as d_minus,
        SUM(g.f) as f,
        SUM(g.ein) as ein, SUM(g.ns) as ns, SUM(g.nc) as nc,
        SUM(g.abs) as abs, SUM(g.p) as p, SUM(g.s) as s
       FROM courses c
       JOIN course_sections cs ON cs.course_code = c.code
       JOIN course_section_professors csp ON csp.course_section_id = cs.id
       LEFT JOIN course_section_grades g ON g.course_section_id = cs.id
       WHERE csp.professor_id = ?
       GROUP BY c.code
       ORDER BY c.code`
    )
    .all(professorId) as any[];

  const sectionCodes = new Set(sectionCourses.map((c: any) => c.code));

  // Also include courses from RMP courses_taught that exist in our DB
  const rmp = db
    .prepare("SELECT courses_taught FROM rmp_reviews WHERE professor_id = ?")
    .get(professorId) as { courses_taught: string } | undefined;

  if (rmp?.courses_taught) {
    try {
      const taught: { name: string }[] = JSON.parse(rmp.courses_taught);
      for (const t of taught) {
        const cname = t.name.toUpperCase().trim();
        // Try direct match, then strip trailing letter
        const candidates = [cname, cname.replace(/[A-Z]$/, "")];
        // Handle OR combos
        if (cname.includes("OR")) {
          candidates.push(...cname.split("OR"));
        }
        for (const candidate of candidates) {
          if (!sectionCodes.has(candidate)) {
            const course = db
              .prepare("SELECT code, title, credits, subject_code FROM courses WHERE code = ?")
              .get(candidate) as Course | undefined;
            if (course) {
              sectionCodes.add(candidate);
              sectionCourses.push({ ...course, a_plus: 0, a: 0, a_minus: 0, b_plus: 0, b: 0, b_minus: 0, c_plus: 0, c: 0, c_minus: 0, d_plus: 0, d: 0, d_minus: 0, f: 0, ein: 0, ns: 0, nc: 0, abs: 0, p: 0, s: 0 });
            }
          }
        }
      }
    } catch { /* ignore parse errors */ }
  }

  return sectionCourses.sort((a: any, b: any) => a.code.localeCompare(b.code));
}
