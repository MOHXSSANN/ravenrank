import Database from "better-sqlite3";
import path from "path";

const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), "..", "scraper", "data", "ravenrank.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
    db.pragma("journal_mode = WAL");
  }
  return db;
}

// Type definitions matching our schema
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
  tags: string; // JSON string of [{name, count}]
  courses_taught: string; // JSON string of [{name, count}]
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
