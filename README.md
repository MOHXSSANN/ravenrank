# RavenRank

Carleton University grade distributions, professor ratings, and course data. Built by a Carleton student, for Carleton students.

## Features

- **Grade distributions** across thousands of course sections with detailed histograms
- **Professor ratings** sourced from RateMyProfessors (3,300+ professors with quality, difficulty, tags, and would-take-again percentages)
- **Course catalog** sourced from the official Carleton University academic calendar (3,800+ courses)
- **Professor comparison** for side-by-side grade distribution analysis across instructors
- **Instant search** across all courses, professors, and subjects (Cmd+K)
- **Scroll-driven animation** with frame-by-frame video playback

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Database**: SQLite via better-sqlite3
- **Search**: Client-side preloaded index for instant filtering
- **Scraper**: Python + Scrapy for course catalog, custom GraphQL client for RateMyProfessors

## Project Structure

```
ravenrank/
  frontend/        Next.js application
    src/
      app/         Pages and API routes
      components/  UI components (hero, search, grade charts)
      lib/         Database, queries, grade utilities
    public/        Static assets and animation frames
  scraper/         Python scraper and database seeder
    scraper/
      spiders/     Scrapy spiders for Carleton courses
      scripts/     RMP fetcher and DB seeder
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+

### Scraper

```bash
cd scraper
pip install -r requirements.txt

# Scrape Carleton course catalog
scrapy crawl carleton_courses -o data/subjects.json

# Fetch RateMyProfessors data
python -m scraper.scripts.fetch_rmp_professors

# Seed the database
python -m scraper.scripts.seed_database
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Sources

- **Course catalog**: Sourced from the official Carleton University academic calendar
- **Professor ratings**: Sourced from RateMyProfessors
- **Grade distributions**: Aggregate data obtained through FIPPA

## Disclaimer

RavenRank is an independent student project and is not affiliated with, endorsed by, or officially connected to Carleton University or RateMyProfessors. All trademarks belong to their respective owners.
