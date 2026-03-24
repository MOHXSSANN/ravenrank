"""
Seed the RavenRank SQLite database with scraped course data and mock grade distributions.

Usage:
    python -m scraper.scripts.seed_database [--db PATH] [--subjects PATH] [--professors PATH]

Reads:
    - data/subjects.json (from carleton_courses spider)
    - data/professors.json (from rmp spider, optional)

Creates/populates:
    - SQLite database with subjects, courses, professors, sections, and grade distributions
"""

import argparse
import hashlib
import json
import os
import random
import sqlite3
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB = os.path.join(SCRIPT_DIR, "..", "..", "data", "ravenrank.db")
DEFAULT_SUBJECTS = os.path.join(SCRIPT_DIR, "..", "..", "data", "subjects.json")
DEFAULT_PROFESSORS = os.path.join(SCRIPT_DIR, "..", "..", "data", "professors.json")

# Mock terms: Fall 2019 through Fall 2025
MOCK_TERMS = []
for year in range(2019, 2026):
    MOCK_TERMS.append((year * 10 + 0, f"Winter {year}"))
    MOCK_TERMS.append((year * 10 + 1, f"Summer {year}"))
    MOCK_TERMS.append((year * 10 + 2, f"Fall {year}"))

# Grade letters and their GPA-ish weights for generating realistic distributions
GRADE_LETTERS = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]
GRADE_COLUMNS = [
    "a_plus", "a", "a_minus", "b_plus", "b", "b_minus", "c_plus", "c", "c_minus", "d_plus", "d", "d_minus", "f",
    "ein", "ns", "nc", "abs", "p", "s",
]

# Realistic grade distribution weights (bell curve shifted toward B range)
# 13 letter grades: A+ A A- B+ B B- C+ C C- D+ D D- F
NORMAL_WEIGHTS = [0.04, 0.08, 0.10, 0.12, 0.14, 0.10, 0.10, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02]
EASY_WEIGHTS =   [0.10, 0.15, 0.13, 0.13, 0.10, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02, 0.02, 0.01]
HARD_WEIGHTS =   [0.02, 0.04, 0.06, 0.08, 0.10, 0.10, 0.12, 0.12, 0.10, 0.08, 0.06, 0.04, 0.04]

MOCK_PROF_FIRST = [
    "James", "Robert", "John", "Michael", "David", "William", "Richard", "Joseph",
    "Thomas", "Christopher", "Mary", "Patricia", "Jennifer", "Linda", "Barbara",
    "Elizabeth", "Susan", "Sarah", "Karen", "Lisa", "Wei", "Yun", "Ahmed",
    "Priya", "Dmitri", "Fatima", "Carlos", "Aisha", "Ivan", "Sonia",
]
MOCK_PROF_LAST = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Anderson", "Taylor", "Thomas", "Moore", "Jackson",
    "White", "Harris", "Martin", "Thompson", "Young", "Chen", "Wang", "Kumar",
    "Patel", "Kim", "Li", "Liu", "Singh", "Ali", "Nguyen",
]


def section_id_hash(course_code: str, term_id: int, section: str) -> int:
    """Generate a deterministic integer ID from course+term+section."""
    key = f"{course_code}:{term_id}:{section}"
    return int(hashlib.sha256(key.encode()).hexdigest()[:15], 16)


def generate_mock_grades(class_size: int, difficulty: str = "normal") -> dict:
    """Generate a realistic mock grade distribution for a given class size."""
    if difficulty == "easy":
        weights = EASY_WEIGHTS
    elif difficulty == "hard":
        weights = HARD_WEIGHTS
    else:
        weights = NORMAL_WEIGHTS

    # Add some randomness to the weights
    jittered = [max(0.01, w + random.gauss(0, 0.02)) for w in weights]
    total_w = sum(jittered)
    jittered = [w / total_w for w in jittered]

    # Distribute students across grades (13 letter grades: A+ through F)
    num_letter_grades = len(GRADE_LETTERS)
    grades = {}
    remaining = class_size
    for i, col in enumerate(GRADE_COLUMNS[:num_letter_grades]):
        if i == num_letter_grades - 1:  # last grade gets the remainder
            grades[col] = remaining
        else:
            count = round(class_size * jittered[i])
            count = min(count, remaining)
            grades[col] = count
            remaining -= count

    # Small number of special statuses
    grades["ein"] = random.randint(0, max(1, class_size // 30))
    grades["ns"] = random.randint(0, max(1, class_size // 40))
    grades["nc"] = 0
    grades["abs"] = random.randint(0, max(1, class_size // 50))
    grades["p"] = 0
    grades["s"] = 0

    return grades


def generate_mock_professor_name(used_names: set) -> str:
    """Generate a unique mock professor name."""
    for _ in range(100):
        name = f"{random.choice(MOCK_PROF_FIRST)} {random.choice(MOCK_PROF_LAST)}"
        if name not in used_names:
            used_names.add(name)
            return name
    # Fallback
    name = f"Prof{len(used_names)}"
    used_names.add(name)
    return name


def create_tables(conn: sqlite3.Connection):
    """Create the database schema."""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS subjects (
            code TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            school TEXT NOT NULL DEFAULT '',
            faculty TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS courses (
            code TEXT PRIMARY KEY,
            subject_code TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            components TEXT NOT NULL DEFAULT '',
            prerequisites TEXT,
            precludes TEXT,
            also_listed_as TEXT,
            credits REAL NOT NULL DEFAULT 0.5,
            FOREIGN KEY (subject_code) REFERENCES subjects(code)
        );

        CREATE TABLE IF NOT EXISTS professors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            public_id INTEGER UNIQUE
        );

        CREATE TABLE IF NOT EXISTS rmp_reviews (
            professor_id INTEGER PRIMARY KEY,
            rating REAL,
            difficulty REAL,
            num_ratings INTEGER,
            would_take_again REAL DEFAULT -1,
            department TEXT,
            link TEXT,
            tags TEXT DEFAULT '[]',
            courses_taught TEXT DEFAULT '[]',
            FOREIGN KEY (professor_id) REFERENCES professors(id)
        );

        CREATE TABLE IF NOT EXISTS course_sections (
            id INTEGER PRIMARY KEY,
            course_code TEXT NOT NULL,
            subject_code TEXT NOT NULL,
            term_id INTEGER NOT NULL,
            section TEXT NOT NULL,
            FOREIGN KEY (course_code) REFERENCES courses(code),
            FOREIGN KEY (subject_code) REFERENCES subjects(code),
            UNIQUE(course_code, term_id, section)
        );

        CREATE TABLE IF NOT EXISTS course_section_professors (
            professor_id INTEGER NOT NULL,
            course_section_id INTEGER NOT NULL,
            PRIMARY KEY (professor_id, course_section_id),
            FOREIGN KEY (professor_id) REFERENCES professors(id),
            FOREIGN KEY (course_section_id) REFERENCES course_sections(id)
        );

        CREATE TABLE IF NOT EXISTS course_section_grades (
            course_section_id INTEGER PRIMARY KEY,
            a_plus INTEGER DEFAULT 0,
            a INTEGER DEFAULT 0,
            a_minus INTEGER DEFAULT 0,
            b_plus INTEGER DEFAULT 0,
            b INTEGER DEFAULT 0,
            b_minus INTEGER DEFAULT 0,
            c_plus INTEGER DEFAULT 0,
            c INTEGER DEFAULT 0,
            c_minus INTEGER DEFAULT 0,
            d_plus INTEGER DEFAULT 0,
            d INTEGER DEFAULT 0,
            d_minus INTEGER DEFAULT 0,
            f INTEGER DEFAULT 0,
            ein INTEGER DEFAULT 0,
            ns INTEGER DEFAULT 0,
            nc INTEGER DEFAULT 0,
            abs INTEGER DEFAULT 0,
            p INTEGER DEFAULT 0,
            s INTEGER DEFAULT 0,
            FOREIGN KEY (course_section_id) REFERENCES course_sections(id)
        );

        CREATE INDEX IF NOT EXISTS idx_courses_subject ON courses(subject_code);
        CREATE INDEX IF NOT EXISTS idx_sections_course ON course_sections(course_code);
        CREATE INDEX IF NOT EXISTS idx_sections_subject ON course_sections(subject_code);
        CREATE INDEX IF NOT EXISTS idx_sections_term ON course_sections(term_id);
        CREATE INDEX IF NOT EXISTS idx_professors_name ON professors(name);
    """)


def seed_subjects_and_courses(conn: sqlite3.Connection, subjects_data: list):
    """Seed subjects and courses from scraped data."""
    for subject in subjects_data:
        code = subject.get("code", "").upper()
        title = subject.get("title", "")
        school = subject.get("school", "")
        faculty = subject.get("faculty", "")

        conn.execute(
            "INSERT OR REPLACE INTO subjects (code, title, school, faculty) VALUES (?, ?, ?, ?)",
            (code, title, school, faculty),
        )

        for course in subject.get("courses", []):
            course_code = course.get("code", "").upper()
            if not course_code:
                continue

            # Clean title: remove the course code prefix if present
            course_title = course.get("title", "")
            # Title often starts with "COMP 1001 ..." - remove the code part
            if course_title.upper().startswith(course_code[:4]):
                parts = course_title.split(" ", 2)
                if len(parts) >= 3:
                    course_title = parts[2]  # Skip "COMP 1001 Title..."
                elif len(parts) == 2:
                    course_title = parts[1]

            credits = float(course.get("credits", 0.5))
            description = course.get("description", "")
            components = course.get("components", "")
            prerequisites = course.get("prerequisites", "") or None
            precludes = course.get("precludes", "") or None
            also_listed = course.get("also_listed_as", "") or None

            conn.execute(
                """INSERT OR REPLACE INTO courses
                   (code, subject_code, title, description, components, prerequisites, precludes, also_listed_as, credits)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (course_code, code, course_title, description, components,
                 prerequisites, precludes, also_listed, credits),
            )

    conn.commit()


def seed_mock_professors(conn: sqlite3.Connection, num_professors: int = 200) -> list[int]:
    """Generate mock professors and return their IDs."""
    used_names = set()
    prof_ids = []

    for i in range(num_professors):
        name = generate_mock_professor_name(used_names)
        cursor = conn.execute(
            "INSERT INTO professors (name, public_id) VALUES (?, ?)",
            (name, i + 1),
        )
        prof_ids.append(cursor.lastrowid)

    conn.commit()
    return prof_ids


def seed_real_professors(conn: sqlite3.Connection, professors_data: list) -> list[int]:
    """Seed real professors from RMP data and return their IDs."""
    prof_ids = []

    for i, prof in enumerate(professors_data):
        name = prof.get("name", f"Professor {i}")
        cursor = conn.execute(
            "INSERT INTO professors (name, public_id) VALUES (?, ?)",
            (name, i + 1),
        )
        prof_id = cursor.lastrowid
        prof_ids.append(prof_id)

        # Add RMP review if available
        rating = prof.get("rating")
        if rating:
            tags_json = json.dumps(prof.get("tags", []))
            courses_json = json.dumps(prof.get("courses", []))
            conn.execute(
                """INSERT OR REPLACE INTO rmp_reviews
                   (professor_id, rating, difficulty, num_ratings, would_take_again,
                    department, link, tags, courses_taught)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    prof_id,
                    float(rating) if rating else None,
                    float(prof.get("difficulty", 0)) if prof.get("difficulty") else None,
                    int(prof.get("num_ratings", 0)) if prof.get("num_ratings") else None,
                    float(prof.get("would_take_again", -1)),
                    prof.get("department"),
                    f"https://www.ratemyprofessors.com/professor/{prof.get('rmp_id', '')}",
                    tags_json,
                    courses_json,
                ),
            )

    conn.commit()
    return prof_ids


def seed_mock_sections_and_grades(
    conn: sqlite3.Connection,
    prof_ids: list[int],
    professors_data: list,
    num_terms: int = 8,
):
    """Generate mock course sections with grade distributions.
    Uses RMP courses_taught data to assign professors to courses they actually teach.
    """
    courses = conn.execute("SELECT code, subject_code FROM courses").fetchall()
    course_set = {code for code, _ in courses}
    terms = MOCK_TERMS[-num_terms:]

    # Build professor -> set of course codes they teach (from RMP)
    # Then invert to course -> professors
    import re

    # First build a subject lookup: course_code -> subject_code
    course_to_subject = {code: subj for code, subj in courses}

    # Build all subject codes for prefix matching
    all_subjects = set(course_to_subject.values())

    course_to_profs: dict[str, list[int]] = {}
    prof_course_map: dict[int, set[str]] = {}  # track which courses each prof teaches

    # Two-pass approach: first pass collects subject prefixes per professor,
    # second pass resolves bare numbers using those prefixes.
    prof_raw_courses: dict[int, list[str]] = {}
    prof_subjects: dict[int, set[str]] = {}

    for idx, prof in enumerate(professors_data):
        prof_id = prof_ids[idx]
        rmp_courses = prof.get("courses", [])
        matched = set()
        raw_names = []

        for rc in rmp_courses:
            cname = rc["name"].upper().strip()
            raw_names.append(cname)

            # Direct match
            if cname in course_set:
                matched.add(cname)
                continue

            # Strip trailing section letters (e.g. COMP1405B -> COMP1405)
            stripped = re.sub(r'[A-Z]$', '', cname)
            if stripped in course_set:
                matched.add(stripped)
                continue

            # Handle "OR" combos like COMP1405OR1005 -> try each part
            if 'OR' in cname:
                parts = cname.split('OR')
                for part in parts:
                    # Part might be full code or bare number
                    if part in course_set:
                        matched.add(part)
                    else:
                        stripped_part = re.sub(r'[A-Z]$', '', part)
                        if stripped_part in course_set:
                            matched.add(stripped_part)

        # Collect subject prefixes from matched courses
        subjects_for_prof = set()
        for code in matched:
            subj = course_to_subject.get(code, "")
            if subj:
                subjects_for_prof.add(subj)

        # Also extract subject prefix from RMP department
        dept = prof.get("department", "")
        if dept:
            # e.g. "Computer Science" -> might help but not directly a code
            pass

        prof_subjects[prof_id] = subjects_for_prof
        prof_raw_courses[prof_id] = raw_names

        for code in matched:
            course_to_profs.setdefault(code, []).append(prof_id)
        prof_course_map[prof_id] = matched

    # Second pass: resolve bare numbers and OR-combo bare numbers
    for idx, prof in enumerate(professors_data):
        prof_id = prof_ids[idx]
        subjects_for_prof = prof_subjects[prof_id]
        if not subjects_for_prof:
            continue

        additional = set()
        for cname in prof_raw_courses[prof_id]:
            # Handle bare numbers like "1405A" or "1005"
            bare = re.sub(r'[A-Z]+$', '', cname)
            if bare.isdigit() and len(bare) == 4:
                for subj in subjects_for_prof:
                    candidate = subj + bare
                    if candidate in course_set and candidate not in prof_course_map[prof_id]:
                        additional.add(candidate)

            # Handle OR combos where one part is bare: COMP1405OR1005
            if 'OR' in cname:
                parts = cname.split('OR')
                for part in parts:
                    part_bare = re.sub(r'[A-Z]+$', '', part)
                    if part_bare.isdigit() and len(part_bare) == 4:
                        for subj in subjects_for_prof:
                            candidate = subj + part_bare
                            if candidate in course_set and candidate not in prof_course_map[prof_id]:
                                additional.add(candidate)

        if additional:
            prof_course_map[prof_id].update(additional)
            for code in additional:
                course_to_profs.setdefault(code, []).append(prof_id)

    # Deduplicate
    for code in course_to_profs:
        course_to_profs[code] = list(set(course_to_profs[code]))

    matched_courses = len(course_to_profs)
    print(f"  -> {matched_courses} courses matched to real RMP professors")

    sections_created = 0
    for course_code, subject_code in courses:
        course_terms = random.sample(terms, k=min(len(terms), random.randint(2, 6)))

        # Only use professors verified from RMP data — no fallback guessing
        if course_code in course_to_profs:
            course_profs = course_to_profs[course_code]
        else:
            course_profs = []  # no professors if none matched from RMP

        course_num = int("".join(c for c in course_code if c.isdigit())[:4])
        if course_num >= 4000:
            difficulty = "hard"
        elif course_num >= 2000:
            difficulty = "normal"
        else:
            difficulty = random.choice(["easy", "normal"])

        # Collect all section IDs for this course so we can assign all professors
        course_section_ids = []

        for term_id, term_name in course_terms:
            num_sections = random.choices([1, 2], weights=[0.7, 0.3])[0]

            for sec_num in range(num_sections):
                section = chr(65 + sec_num)
                sid = section_id_hash(course_code, term_id, section)

                try:
                    conn.execute(
                        """INSERT INTO course_sections (id, course_code, subject_code, term_id, section)
                           VALUES (?, ?, ?, ?, ?)""",
                        (sid, course_code, subject_code, term_id, section),
                    )
                except sqlite3.IntegrityError:
                    continue

                class_size = random.randint(20, 300)
                grades = generate_mock_grades(class_size, difficulty)

                conn.execute(
                    """INSERT INTO course_section_grades
                       (course_section_id, a_plus, a, a_minus, b_plus, b, b_minus, c_plus, c, c_minus, d_plus, d, d_minus, f, ein, ns, nc, abs, p, s)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (sid, *[grades[col] for col in GRADE_COLUMNS]),
                )

                course_section_ids.append(sid)
                sections_created += 1

        # Assign professors to sections: distribute evenly so every professor
        # gets at least one section with grade data
        if course_section_ids and course_profs:
            random.shuffle(course_section_ids)
            for i, prof_id in enumerate(course_profs):
                # Each professor gets assigned to at least one section
                assigned_sid = course_section_ids[i % len(course_section_ids)]
                try:
                    conn.execute(
                        "INSERT INTO course_section_professors (professor_id, course_section_id) VALUES (?, ?)",
                        (prof_id, assigned_sid),
                    )
                except sqlite3.IntegrityError:
                    pass
            # If more sections than professors, assign remaining sections randomly
            for j in range(len(course_profs), len(course_section_ids)):
                prof_id = random.choice(course_profs)
                try:
                    conn.execute(
                        "INSERT INTO course_section_professors (professor_id, course_section_id) VALUES (?, ?)",
                        (prof_id, course_section_ids[j]),
                    )
                except sqlite3.IntegrityError:
                    pass

    conn.commit()
    return sections_created


def main():
    parser = argparse.ArgumentParser(description="Seed RavenRank database")
    parser.add_argument("--db", default=DEFAULT_DB, help="Path to SQLite database")
    parser.add_argument("--subjects", default=DEFAULT_SUBJECTS, help="Path to subjects.json")
    parser.add_argument("--professors", default=DEFAULT_PROFESSORS, help="Path to professors.json (optional)")
    parser.add_argument("--terms", type=int, default=8, help="Number of recent terms to generate data for")
    args = parser.parse_args()

    # Load scraped data
    if not os.path.exists(args.subjects):
        print(f"Error: {args.subjects} not found. Run the carleton_courses spider first.")
        sys.exit(1)

    with open(args.subjects) as f:
        subjects_data = json.load(f)

    professors_data = []
    if os.path.exists(args.professors):
        with open(args.professors) as f:
            professors_data = json.load(f)

    # Create database
    os.makedirs(os.path.dirname(os.path.abspath(args.db)), exist_ok=True)
    if os.path.exists(args.db):
        os.remove(args.db)

    conn = sqlite3.connect(args.db)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")

    print("Creating tables...")
    create_tables(conn)

    print(f"Seeding {len(subjects_data)} subjects and courses...")
    seed_subjects_and_courses(conn, subjects_data)

    course_count = conn.execute("SELECT COUNT(*) FROM courses").fetchone()[0]
    print(f"  -> {course_count} courses seeded")

    if professors_data:
        print(f"Seeding {len(professors_data)} real professors (from RMP)...")
        prof_ids = seed_real_professors(conn, professors_data)
    else:
        print("No RMP data found. Generating 200 mock professors...")
        prof_ids = seed_mock_professors(conn, 200)

    print(f"Generating mock sections and grade distributions ({args.terms} terms)...")
    sections_count = seed_mock_sections_and_grades(conn, prof_ids, professors_data, args.terms)
    print(f"  -> {sections_count} course sections with grades created")

    # Summary
    stats = {
        "subjects": conn.execute("SELECT COUNT(*) FROM subjects").fetchone()[0],
        "courses": conn.execute("SELECT COUNT(*) FROM courses").fetchone()[0],
        "professors": conn.execute("SELECT COUNT(*) FROM professors").fetchone()[0],
        "sections": conn.execute("SELECT COUNT(*) FROM course_sections").fetchone()[0],
        "grade_records": conn.execute("SELECT COUNT(*) FROM course_section_grades").fetchone()[0],
    }

    print("\nDatabase seeded successfully!")
    print(f"  Database: {os.path.abspath(args.db)}")
    for key, val in stats.items():
        print(f"  {key}: {val:,}")

    conn.close()


if __name__ == "__main__":
    main()
