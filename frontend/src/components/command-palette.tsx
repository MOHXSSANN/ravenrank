"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, GraduationCap, Search, User, X } from "lucide-react";

interface SearchIndex {
  courses: Array<{ code: string; title: string; subject_code: string; credits: number }>;
  professors: Array<{ id: number; name: string; public_id: number | null; department?: string | null; rating?: number | null }>;
  subjects: Array<{ code: string; title: string; school: string; faculty: string }>;
}

const EMPTY: SearchIndex = { courses: [], professors: [], subjects: [] };

let cachedIndex: SearchIndex | null = null;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex | null>(cachedIndex);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search index once on first open
  useEffect(() => {
    if (!open || cachedIndex) return;
    fetch("/api/search-index")
      .then((r) => r.json())
      .then((data) => {
        cachedIndex = data;
        setIndex(data);
      })
      .catch(() => {});
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const openFromHero = () => setOpen(true);
    document.addEventListener("keydown", down);
    document.addEventListener("open-command-palette", openFromHero);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("open-command-palette", openFromHero);
    };
  }, []);

  // Client-side filtering — instant, no network
  const results = useMemo(() => {
    if (!index || !query.trim()) return EMPTY;
    const q = query.trim().toLowerCase();
    const qNoSpaces = q.replace(/\s+/g, "");

    const subjects = index.subjects
      .filter((s) => s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q))
      .slice(0, 6);

    const courses = index.courses
      .filter((c) => {
        const code = c.code.toLowerCase();
        return code.includes(q) || code.includes(qNoSpaces) || c.title.toLowerCase().includes(q);
      })
      .slice(0, 8);

    const professors = index.professors
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 6);

    return { courses, professors, subjects };
  }, [index, query]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      router.push(path);
    },
    [router]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  if (!open) return null;

  const hasResults =
    results.courses.length > 0 ||
    results.professors.length > 0 ||
    results.subjects.length > 0;

  const loading = !index;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-background/80"
        onClick={handleClose}
      />

      <div className="relative max-w-2xl mx-auto mt-[15vh] px-4">
        <Command
          className="rounded-2xl border border-border/50 bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden"
          shouldFilter={false}
        >
          <div className="flex items-center border-b border-border/50 px-4">
            <Search className="w-4 h-4 text-muted-foreground mr-3 shrink-0" strokeWidth={1.5} />
            <Command.Input
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Search courses, professors, subjects..."
              className="flex-1 py-4 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 hover:bg-secondary rounded transition-colors duration-150"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <kbd className="ml-3 text-[10px] text-muted-foreground/50 font-mono bg-secondary/50 px-1.5 py-0.5 rounded">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            {loading && (
              <div className="px-4 py-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-4 h-4 rounded bg-secondary" />
                    <div className="h-4 rounded bg-secondary flex-1 max-w-[60%]" />
                  </div>
                ))}
              </div>
            )}

            {!loading && !query && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Start typing to search...
              </div>
            )}

            {!loading && query && !hasResults && (
              <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results for &quot;{query}&quot;
              </Command.Empty>
            )}

            {results.subjects.length > 0 && (
              <Command.Group
                heading={
                  <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Subjects
                  </span>
                }
              >
                {results.subjects.map((subject) => (
                  <Command.Item
                    key={`s-${subject.code}`}
                    value={`s-${subject.code}`}
                    onSelect={() => navigate(`/subject/${subject.code}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-secondary/60 data-[selected=true]:bg-secondary/60 transition-colors duration-150"
                  >
                    <BookOpen className="w-4 h-4 text-raven shrink-0" strokeWidth={1.5} />
                    <div>
                      <span className="font-medium">{subject.code}</span>
                      <span className="text-muted-foreground ml-2">{subject.title}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.courses.length > 0 && (
              <Command.Group
                heading={
                  <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Courses
                  </span>
                }
              >
                {results.courses.map((course) => (
                  <Command.Item
                    key={`c-${course.code}`}
                    value={`c-${course.code}`}
                    onSelect={() => navigate(`/course/${course.code}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-secondary/60 data-[selected=true]:bg-secondary/60 transition-colors duration-150"
                  >
                    <GraduationCap className="w-4 h-4 text-raven shrink-0" strokeWidth={1.5} />
                    <div>
                      <span className="font-medium">
                        {course.code.replace(/(\D+)(\d+)/, "$1 $2")}
                      </span>
                      <span className="text-muted-foreground ml-2">{course.title}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.professors.length > 0 && (
              <Command.Group
                heading={
                  <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Professors
                  </span>
                }
              >
                {results.professors.map((prof) => (
                  <Command.Item
                    key={`p-${prof.id}`}
                    value={`p-${prof.id}`}
                    onSelect={() => navigate(`/professor/${prof.public_id || prof.id}`)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-secondary/60 data-[selected=true]:bg-secondary/60 transition-colors duration-150"
                  >
                    <User className="w-4 h-4 text-raven shrink-0" strokeWidth={1.5} />
                    <div>
                      <span className="font-medium">{prof.name}</span>
                      {prof.department && (
                        <span className="text-muted-foreground ml-2 text-xs">{prof.department}</span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2 text-[10px] text-muted-foreground/50">
            <div className="flex items-center gap-2 font-mono">
              <kbd className="bg-secondary/50 px-1.5 py-0.5 rounded">↑↓</kbd>
              <span>Navigate</span>
              <kbd className="bg-secondary/50 px-1.5 py-0.5 rounded ml-2">↵</kbd>
              <span>Open</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
