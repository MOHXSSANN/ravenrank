import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

function toPgParams(query: string): string {
  let i = 0;
  return query.replace(/\?/g, () => `$${++i}`);
}

export async function dbAll<T = Record<string, unknown>>(query: string, args: unknown[] = []): Promise<T[]> {
  const rows = await sql(toPgParams(query), args);
  return rows as T[];
}

export async function dbGet<T = Record<string, unknown>>(query: string, args: unknown[] = []): Promise<T | undefined> {
  const rows = await sql(toPgParams(query), args);
  return rows[0] as T | undefined;
}

export interface Subject {
  code: string;
  title: string;
  school: string;
  faculty: string;
}

export interface Course {
  code: string;
  subject_code: string;
  title: string;
  description: string;
  components: string;
  prerequisites: string | null;
  precludes: string | null;
  also_listed_as: string | null;
  credits: number;
}

export interface Professor {
  id: number;
  name: string;
  public_id: number | null;
}

export interface RmpReview {
  professor_id: number;
  rating: number | null;
  difficulty: number | null;
  num_ratings: number | null;
  would_take_again: number | null;
  department: string | null;
  link: string | null;
  tags: string;
  courses_taught: string;
}

export interface RmpTag {
  name: string;
  count: number;
}

export interface CourseSection {
  id: number;
  course_code: string;
  subject_code: string;
  term_id: number;
  section: string;
}

export interface GradeDistribution {
  course_section_id: number;
  a_plus: number;
  a: number;
  a_minus: number;
  b_plus: number;
  b: number;
  b_minus: number;
  c_plus: number;
  c: number;
  c_minus: number;
  d_plus: number;
  d: number;
  d_minus: number;
  f: number;
  ein: number;
  ns: number;
  nc: number;
  abs: number;
  p: number;
  s: number;
}
