import { createClient, type Client, type Row } from "@libsql/client";
import path from "path";

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    if (process.env.TURSO_DATABASE_URL) {
      // Production: connect to Turso
      client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    } else {
      // Local dev: use SQLite file
      const dbPath = path.join(process.cwd(), "..", "scraper", "data", "ravenrank.db");
      client = createClient({
        url: `file:${dbPath}`,
      });
    }
  }
  return client;
}

// Synchronous-style wrapper for server components
// @libsql/client execute() is async, so we need helpers

export async function dbAll<T = Row>(sql: string, args: any[] = []): Promise<T[]> {
  const result = await getClient().execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function dbGet<T = Row>(sql: string, args: any[] = []): Promise<T | undefined> {
  const result = await getClient().execute({ sql, args });
  return result.rows[0] as unknown as T | undefined;
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
