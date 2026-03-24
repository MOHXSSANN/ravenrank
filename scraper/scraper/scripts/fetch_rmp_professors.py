"""
Fetch ALL Carleton University professors from RateMyProfessors GraphQL API
with full data: ratings, difficulty, would-take-again %, quality, and tags.

Two passes:
  1. Bulk search to get all professor IDs + basic stats
  2. Individual queries for each professor to get tags + would-take-again %
"""

import json
import os
import sys
import time

try:
    import requests
except ImportError:
    print("Installing requests...")
    os.system(f"{sys.executable} -m pip install requests")
    import requests

SCHOOL_ID = "U2Nob29sLTE0MjA="  # Base64 for "School-1420" (Carleton University)
GRAPHQL_URL = "https://www.ratemyprofessors.com/graphql"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Basic dGVzdDp0ZXN0",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.ratemyprofessors.com/",
    "Origin": "https://www.ratemyprofessors.com",
}

# Pass 1: Bulk search query
SEARCH_QUERY = """
query TeacherSearchPaginationQuery($count: Int!, $cursor: String, $query: TeacherSearchQuery!) {
  search: newSearch {
    teachers(query: $query, first: $count, after: $cursor) {
      edges {
        node {
          id
          legacyId
          firstName
          lastName
          department
          avgRating
          avgDifficulty
          numRatings
          wouldTakeAgainPercent
          school {
            id
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
"""

# Pass 2: Individual teacher query for tags + detailed info
TEACHER_QUERY = """
query TeacherRatingsPageQuery($id: ID!) {
  node(id: $id) {
    ... on Teacher {
      id
      legacyId
      firstName
      lastName
      department
      avgRating
      avgDifficulty
      numRatings
      wouldTakeAgainPercent
      teacherRatingTags {
        tagName
        tagCount
      }
      courseCodes {
        courseName
        courseCount
      }
    }
  }
}
"""


def fetch_all_professors_bulk():
    """Pass 1: Get all professors with basic stats."""
    professors = []
    cursor = None
    page = 0

    while True:
        page += 1
        variables = {
            "count": 1000,
            "cursor": cursor or "",
            "query": {"text": "", "schoolID": SCHOOL_ID},
        }

        resp = requests.post(
            GRAPHQL_URL,
            json={"query": SEARCH_QUERY, "variables": variables},
            headers=HEADERS,
        )
        if resp.status_code != 200:
            print(f"  Error: HTTP {resp.status_code}")
            break

        data = resp.json()
        teachers = data["data"]["search"]["teachers"]
        edges = teachers["edges"]

        for edge in edges:
            node = edge["node"]
            name = " ".join(f"{node['firstName']} {node['lastName']}".split())
            professors.append({
                "graphql_id": node["id"],
                "rmp_id": node["legacyId"],
                "name": name,
                "first_name": node["firstName"].strip(),
                "last_name": node["lastName"].strip(),
                "department": node.get("department") or "",
                "rating": node.get("avgRating") or 0,
                "difficulty": node.get("avgDifficulty") or 0,
                "num_ratings": node.get("numRatings") or 0,
                "would_take_again": node.get("wouldTakeAgainPercent") or -1,
                "tags": [],
                "courses": [],
            })

        print(f"  Page {page}: fetched {len(edges)} (total: {len(professors)})")

        if not teachers["pageInfo"]["hasNextPage"]:
            break
        cursor = teachers["pageInfo"]["endCursor"]
        time.sleep(0.3)

    return professors


def fetch_professor_details(professors):
    """Pass 2: Fetch tags and course codes for each professor."""
    total = len(professors)
    print(f"\nFetching detailed data for {total} professors...")

    # Only fetch details for professors who actually have ratings
    rated = [p for p in professors if p["num_ratings"] > 0]
    print(f"  {len(rated)} professors have ratings, fetching their details...")

    for i, prof in enumerate(rated):
        if (i + 1) % 50 == 0 or i == 0:
            print(f"  Progress: {i + 1}/{len(rated)}")

        try:
            resp = requests.post(
                GRAPHQL_URL,
                json={
                    "query": TEACHER_QUERY,
                    "variables": {"id": prof["graphql_id"]},
                },
                headers=HEADERS,
            )

            if resp.status_code != 200:
                continue

            data = resp.json()
            node = data.get("data", {}).get("node")
            if not node:
                continue

            # Update would-take-again if we got a better value
            wta = node.get("wouldTakeAgainPercent")
            if wta is not None and wta >= 0:
                prof["would_take_again"] = round(wta, 1)

            # Tags
            tags = node.get("teacherRatingTags") or []
            prof["tags"] = [
                {"name": t["tagName"], "count": t["tagCount"]}
                for t in tags
                if t["tagCount"] > 0
            ]

            # Courses taught
            courses = node.get("courseCodes") or []
            prof["courses"] = [
                {"name": c["courseName"], "count": c["courseCount"]}
                for c in courses
                if c["courseCount"] > 0
            ]

        except Exception as e:
            print(f"  Error fetching {prof['name']}: {e}")

        # Rate limit: ~5 requests/sec
        time.sleep(0.2)

    print(f"  Done! Fetched details for {len(rated)} professors.")


def main():
    print("=" * 60)
    print("RateMyProfessors - Carleton University - Full Data Fetch")
    print("=" * 60)

    # Pass 1
    print("\n[Pass 1] Bulk fetching all professors...")
    professors = fetch_all_professors_bulk()
    print(f"Total professors found: {len(professors)}")

    # Pass 2
    print("\n[Pass 2] Fetching individual details (tags, would-take-again, courses)...")
    fetch_professor_details(professors)

    # Stats
    rated = [p for p in professors if p["num_ratings"] > 0]
    with_tags = [p for p in professors if len(p["tags"]) > 0]
    with_wta = [p for p in professors if p["would_take_again"] >= 0]
    print(f"\n{'=' * 60}")
    print(f"Total professors:        {len(professors)}")
    print(f"With ratings:            {len(rated)}")
    print(f"With tags:               {len(with_tags)}")
    print(f"With would-take-again:   {len(with_wta)}")

    # Clean up: remove graphql_id before saving (internal only)
    for p in professors:
        del p["graphql_id"]

    # Save
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
    os.makedirs(data_dir, exist_ok=True)
    out_path = os.path.join(data_dir, "professors.json")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(professors, f, indent=2, ensure_ascii=False)

    print(f"\nSaved to {out_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
