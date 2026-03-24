import { dbAll } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const [courses, professors, subjects] = await Promise.all([
    dbAll<{ code: string; title: string; subject_code: string; credits: number }>(
      "SELECT code, title, subject_code, credits FROM courses ORDER BY code"
    ),
    dbAll<{
      id: number;
      name: string;
      public_id: number | null;
      department: string | null;
      rating: number | null;
    }>(
      `SELECT p.id, p.name, p.public_id, r.department, r.rating
       FROM professors p
       LEFT JOIN rmp_reviews r ON r.professor_id = p.id
       ORDER BY p.name`
    ),
    dbAll<{ code: string; title: string; school: string; faculty: string }>(
      "SELECT code, title, school, faculty FROM subjects ORDER BY code"
    ),
  ]);

  return NextResponse.json(
    { courses, professors, subjects },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
