import { getAllSubjects } from "@/lib/queries";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Subjects",
  description: "Browse all academic subjects at Carleton University.",
};

export default async function SubjectsPage() {
  const subjects = await getAllSubjects();

  // Group by first letter
  const grouped: Record<string, typeof subjects> = {};
  for (const subject of subjects) {
    const letter = subject.code[0];
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(subject);
  }

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-none">
          All subjects
        </h1>
        <p className="text-muted-foreground mt-3 max-w-[50ch]">
          <span className="font-mono">{subjects.length}</span> subjects at Carleton University
        </p>
      </div>

      <div className="space-y-10">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letter, subjectList]) => (
            <div key={letter}>
              <h2 className="text-xs font-medium tracking-wider uppercase text-raven mb-4 pb-2 border-b border-border">
                {letter}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden">
                {subjectList.map((subject) => (
                  <Link
                    key={subject.code}
                    href={`/subject/${subject.code}`}
                    className="p-4 bg-card hover:bg-secondary/50 transition-colors duration-200"
                  >
                    <div className="font-semibold text-sm tracking-tight">{subject.code}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {subject.title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
