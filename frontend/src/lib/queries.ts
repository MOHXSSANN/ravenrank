import { dbAll, dbGet } from "./db";
import type {
  Course,
  GradeDistribution,
  Professor,
  RmpReview,
  Subject,
} from "./db";

// ─── Subjects ───

export async function getAllSubjects(): Promise<Subject[]> {
  return dbAll<Subject>("SELECT * FROM subjects ORDER BY code");
}

export async function getSubject(code: string): Promise<Subject | undefined> {
  return dbGet<Subject>("SELECT * FROM subjects WHERE code = ?", [code.toUpperCase()]);
}

export async function getSubjectCourses(subjectCode: string) {
  const courses = await dbAll<Course>(
    "SELECT * FROM courses WHERE subject_code = ? ORDER BY code",
    [subjectCode.toUpperCase()]
  );

  const results = [];
  for (const course of courses) {
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
      WHERE cs.course_code = ?`,
      [course.code]
    );
    results.push({ ...course, grades });
  }
  return results;
}

// ─── Courses ───

export async function getCourse(code: string): Promise<Course | undefined> {
  return dbGet<Course>("SELECT * FROM courses WHERE code = ?", [code.toUpperCase()]);
}

export async function getCourseSections(courseCode: string) {
  const sections = await dbAll(
    `SELECT cs.*, g.*
     FROM course_sections cs
     LEFT JOIN course_section_grades g ON g.course_section_id = cs.id
     WHERE cs.course_code = ?
     ORDER BY cs.term_id DESC, cs.section`,
    [courseCode.toUpperCase()]
  );

  const results = [];
  for (const row of sections as any[]) {
    const professors = await dbAll<Professor>(
      `SELECT p.* FROM professors p
       JOIN course_section_professors csp ON csp.professor_id = p.id
       WHERE csp.course_section_id = ?`,
      [row.id]
    );

    results.push({
      id: row.id,
      course_code: row.course_code,
      subject_code: row.subject_code,
      term_id: row.term_id,
      section: row.section,
      professors,
      grades: {
        a_plus: row.a_plus, a: row.a, a_minus: row.a_minus,
        b_plus: row.b_plus, b: row.b, b_minus: row.b_minus,
        c_plus: row.c_plus, c: row.c, c_minus: row.c_minus,
        d_plus: row.d_plus, d: row.d, d_minus: row.d_minus,
        f: row.f, ein: row.ein, ns: row.ns, nc: row.nc,
        abs: row.abs, p: row.p, s: row.s,
      } as GradeDistribution,
    });
  }
  return results;
}

export async function getCourseAggregateGrades(courseCode: string): Promise<GradeDistribution | undefined> {
  return dbGet<GradeDistribution>(
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
    WHERE cs.course_code = ?`,
    [courseCode.toUpperCase()]
  );
}

export async function getCourseProfessors(courseCode: string) {
  const code = courseCode.toUpperCase();

  const sectionProfs = await dbAll<any>(
    `SELECT DISTINCT p.*, rmp.rating, rmp.difficulty, rmp.num_ratings, rmp.department as rmp_department, rmp.courses_taught
     FROM professors p
     JOIN course_section_professors csp ON csp.professor_id = p.id
     JOIN course_sections cs ON cs.id = csp.course_section_id
     LEFT JOIN rmp_reviews rmp ON rmp.professor_id = p.id
     WHERE cs.course_code = ?
     ORDER BY p.name`,
    [code]
  );

  const seenIds = new Set(sectionProfs.map((p: any) => p.id));

  const rmpProfs = await dbAll<any>(
    `SELECT p.*, rmp.rating, rmp.difficulty, rmp.num_ratings, rmp.department as rmp_department, rmp.courses_taught
     FROM professors p
     JOIN rmp_reviews rmp ON rmp.professor_id = p.id
     WHERE rmp.courses_taught LIKE ?
     ORDER BY p.name`,
    [`%${code}%`]
  );

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
        sectionProfs.push(prof);
      }
    } catch { /* ignore */ }
  }

  return sectionProfs.sort((a: any, b: any) => a.name.localeCompare(b.name));
}

export async function getCourseProfessorGrades(courseCode: string) {
  const code = courseCode.toUpperCase();

  const sectionProfs = await dbAll<any>(
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
     ORDER BY p.name`,
    [code]
  );

  const seenIds = new Set(sectionProfs.map((p: any) => p.id));

  const rmpProfs = await dbAll<any>(
    `SELECT p.id, p.name, p.public_id, rmp.courses_taught
     FROM professors p
     JOIN rmp_reviews rmp ON rmp.professor_id = p.id
     WHERE rmp.courses_taught LIKE ?`,
    [`%${code}%`]
  );

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

export async function getProfessor(id: number) {
  const professor = await dbGet<Professor>(
    "SELECT * FROM professors WHERE id = ? OR public_id = ?",
    [id, id]
  );
  if (!professor) return undefined;

  const rmpReview = await dbGet<RmpReview>(
    "SELECT * FROM rmp_reviews WHERE professor_id = ?",
    [professor.id]
  );

  return { ...professor, rmpReview };
}

export async function getProfessorCourses(professorId: number) {
  const sectionCourses = await dbAll<any>(
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
     ORDER BY c.code`,
    [professorId]
  );

  const sectionCodes = new Set(sectionCourses.map((c: any) => c.code));

  const rmp = await dbGet<{ courses_taught: string }>(
    "SELECT courses_taught FROM rmp_reviews WHERE professor_id = ?",
    [professorId]
  );

  if (rmp?.courses_taught) {
    try {
      const taught: { name: string }[] = JSON.parse(rmp.courses_taught);
      for (const t of taught) {
        const cname = t.name.toUpperCase().trim();
        const candidates = [cname, cname.replace(/[A-Z]$/, "")];
        if (cname.includes("OR")) {
          candidates.push(...cname.split("OR"));
        }
        for (const candidate of candidates) {
          if (!sectionCodes.has(candidate)) {
            const course = await dbGet<Course>(
              "SELECT code, title, credits, subject_code FROM courses WHERE code = ?",
              [candidate]
            );
            if (course) {
              sectionCodes.add(candidate);
              sectionCourses.push({
                ...course,
                a_plus: 0, a: 0, a_minus: 0, b_plus: 0, b: 0, b_minus: 0,
                c_plus: 0, c: 0, c_minus: 0, d_plus: 0, d: 0, d_minus: 0,
                f: 0, ein: 0, ns: 0, nc: 0, abs: 0, p: 0, s: 0,
              });
            }
          }
        }
      }
    } catch { /* ignore */ }
  }

  return sectionCourses.sort((a: any, b: any) => a.code.localeCompare(b.code));
}
