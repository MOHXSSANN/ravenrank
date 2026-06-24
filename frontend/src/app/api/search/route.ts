import { dbAll } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ courses: [], professors: [], subjects: [] });
  }

  const searchTerm = `%${query.trim()}%`;

  const [courses, professors, subjects] = await Promise.all([
    dbAll(
      `SELECT code, title, subject_code, credits
       FROM courses
       WHERE code ILIKE ? OR title ILIKE ?
       ORDER BY code
       LIMIT 8`,
      [searchTerm, searchTerm]
    ),
    dbAll(
      `SELECT id, name, public_id
       FROM professors
       WHERE name ILIKE ?
       ORDER BY name
       LIMIT 6`,
      [searchTerm]
    ),
    dbAll(
      `SELECT code, title, school, faculty
       FROM subjects
       WHERE code ILIKE ? OR title ILIKE ?
       ORDER BY code
       LIMIT 6`,
      [searchTerm, searchTerm]
    ),
  ]);

  return NextResponse.json({ courses, professors, subjects });
}
