import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ courses: [], professors: [], subjects: [] });
  }

  const db = getDb();
  const searchTerm = `%${query.trim()}%`;

  const courses = db
    .prepare(
      `SELECT code, title, subject_code, credits
       FROM courses
       WHERE code LIKE ? OR title LIKE ?
       ORDER BY code
       LIMIT 8`
    )
    .all(searchTerm, searchTerm);

  const professors = db
    .prepare(
      `SELECT id, name, public_id
       FROM professors
       WHERE name LIKE ?
       ORDER BY name
       LIMIT 6`
    )
    .all(searchTerm);

  const subjects = db
    .prepare(
      `SELECT code, title, school, faculty
       FROM subjects
       WHERE code LIKE ? OR title LIKE ?
       ORDER BY code
       LIMIT 6`
    )
    .all(searchTerm, searchTerm);

  return NextResponse.json({ courses, professors, subjects });
}
