import { dbAll } from "@/lib/db";
import { ProfessorsList } from "./professors-list";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Professors",
  description: "Browse all Carleton University professors with RateMyProfessors ratings.",
};

async function getAllProfessors() {
  return dbAll<{
    id: number;
    name: string;
    public_id: number | null;
    rating: number | null;
    difficulty: number | null;
    num_ratings: number | null;
    would_take_again: number | null;
    department: string | null;
  }>(
    `SELECT p.id, p.name, p.public_id,
      r.rating, r.difficulty, r.num_ratings, r.would_take_again, r.department
     FROM professors p
     LEFT JOIN rmp_reviews r ON r.professor_id = p.id
     ORDER BY CASE WHEN r.num_ratings > 0 THEN 0 ELSE 1 END, r.rating DESC, p.name`
  );
}

export default async function ProfessorsPage() {
  const professors = await getAllProfessors();
  const rated = professors.filter((p) => p.num_ratings && p.num_ratings > 0);

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tighter leading-none">
          Professors
        </h1>
        <p className="mt-3 text-muted-foreground">
          {professors.length.toLocaleString()} professors, {rated.length.toLocaleString()} with RateMyProfessors ratings.
        </p>
      </div>
      <ProfessorsList professors={professors} />
    </div>
  );
}
