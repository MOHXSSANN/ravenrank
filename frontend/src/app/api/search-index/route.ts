import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getDb();

  const courses = db
    .prepare("SELECT code, title, subject_code, credits FROM courses ORDER BY code")
    .all() as Array<{ code: string; title: string; subject_code: string; credits: number }>;

  // Include ALL professors so every name is searchable
  const professors = db
    .prepare(
      `SELECT p.id, p.name, p.public_id, r.department, r.rating
       FROM professors p
       LEFT JOIN rmp_reviews r ON r.professor_id = p.id
       ORDER BY p.name`
    )
    .all() as Array<{
    id: number;
    name: string;
    public_id: number | null;
    department: string | null;
    rating: number | null;
  }>;

  const subjects = db
    .prepare("SELECT code, title, school, faculty FROM subjects ORDER BY code")
    .all() as Array<{ code: string; title: string; school: string; faculty: string }>;

  return NextResponse.json(
    { courses, professors, subjects },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
