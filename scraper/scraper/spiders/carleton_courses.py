import re

import scrapy
from scrapy.http import Response
from scrapy.loader import ItemLoader

from scraper.helpers import normalize_whitespace
from scraper.items import Course, Subject

SUBJECT_LINK_PATTERN = re.compile(r"^(?:/undergrad/courses/)?[A-Za-z]{2,6}/?$")
SUBJECT_TITLE_PATTERN = re.compile(r"(.+)\s+\(([A-Z]{2,5})\)")
CREDITS_PATTERN = re.compile(r"\[(\d+\.?\d*)\s+credits?\]")
COURSE_CODE_PATTERN = re.compile(r"[A-Z]{2,5}\s?\d{4}")


class CarletonCoursesSpider(scrapy.Spider):
    name = "carleton_courses"

    def start_requests(self):
        yield scrapy.Request(
            url="https://calendar.carleton.ca/undergrad/courses/",
            callback=self.parse,
        )

    def parse(self, response: Response):
        links = response.css("#textcontainer a::attr(href)").getall()
        for url in links:
            if SUBJECT_LINK_PATTERN.search(url) is None:
                continue
            yield scrapy.Request(
                url=response.urljoin(url),
                callback=self.parse_course_list,
            )

    def parse_course_list(self, response: Response):
        subject_loader = ItemLoader(Subject(), response)

        # Extract school and faculty from .address block
        address_lines = response.css(".address p *::text").getall()
        address_text = " ".join(line.strip() for line in address_lines if line.strip())
        school = ""
        faculty = ""
        for line in address_lines:
            line = line.strip()
            if not line:
                continue
            if line.startswith("(") and line.endswith(")"):
                faculty = line.strip("()")
            elif not school:
                school = line

        subject_loader.add_value("school", school)
        subject_loader.add_value("faculty", faculty)

        # Extract subject title and code from h1 (the page title h1, not the site header)
        page_title = response.xpath("//h1[not(ancestor::header)][last()]/text()").get("")
        subject_match = SUBJECT_TITLE_PATTERN.search(page_title)
        if subject_match:
            subject_loader.add_value("title", subject_match.group(1).strip())
            subject_loader.add_value("code", subject_match.group(2))
        else:
            subject_loader.add_value("title", page_title.strip())
            # Try to extract code from URL
            url_code = response.url.rstrip("/").split("/")[-1]
            subject_loader.add_value("code", url_code)

        courses = []
        for course_block in response.css(".courseblock"):
            course_loader = ItemLoader(Course(), course_block)

            # Extract course code
            code_text = normalize_whitespace(
                course_block.css(".courseblockcode::text").get("")
            )
            course_loader.add_value("code", code_text, re=COURSE_CODE_PATTERN)

            # Extract title (full courseblocktitle text minus the code)
            title_parts = course_block.css(".courseblocktitle *::text").getall()
            full_title = normalize_whitespace(" ".join(title_parts))

            # Extract credits from title
            credits_match = CREDITS_PATTERN.search(full_title)
            if credits_match:
                course_loader.add_value("credits", credits_match.group(1))

            # Clean title: remove code, credits bracket, extra whitespace
            clean_title = re.sub(CREDITS_PATTERN, "", full_title).strip()
            course_loader.add_value("title", clean_title)

            # Description: text directly inside courseblock, after the title
            # Get all direct text nodes (not inside .coursedescadditional)
            all_texts = course_block.css("::text").getall()
            title_texts = course_block.css(".courseblocktitle *::text").getall()
            additional_texts = course_block.css(".coursedescadditional *::text").getall()

            title_set = set(title_texts)
            additional_set = set(additional_texts)
            desc_parts = []
            for text in all_texts:
                if text in title_set or text in additional_set:
                    continue
                cleaned = text.strip()
                if cleaned:
                    desc_parts.append(cleaned)

            description = " ".join(desc_parts).strip()
            if description:
                course_loader.add_value("description", description)

            # Parse .coursedescadditional for prerequisites, precludes, also-listed-as, components
            additional = course_block.css(".coursedescadditional")
            if additional:
                # Get the full text content with line breaks preserved
                additional_html = additional.get()
                # Split by <br/> or <br /> to get individual lines
                lines_raw = re.split(r"<br\s*/?>", additional_html)
                lines = []
                for line in lines_raw:
                    # Strip HTML tags to get text
                    text = re.sub(r"<[^>]+>", "", line).strip()
                    text = normalize_whitespace(text)
                    if text:
                        lines.append(text)

                prereqs = []
                precludes = []
                also_listed = []
                components = []

                for line in lines:
                    line_lower = line.lower()
                    if line_lower.startswith("prerequisite"):
                        prereqs.append(line)
                    elif line_lower.startswith("preclude"):
                        precludes.append(line)
                    elif line_lower.startswith("also listed as"):
                        also_listed.append(line)
                    elif line_lower.startswith("includes:"):
                        # "Includes: Experiential Learning Activity" - skip
                        pass
                    elif any(
                        kw in line_lower
                        for kw in [
                            "lecture",
                            "tutorial",
                            "laboratory",
                            "seminar",
                            "workshop",
                            "hours a week",
                            "hours per week",
                        ]
                    ):
                        components.append(line)

                if prereqs:
                    course_loader.add_value("prerequisites", " ".join(prereqs))
                if precludes:
                    course_loader.add_value("precludes", " ".join(precludes))
                if also_listed:
                    course_loader.add_value("also_listed_as", " ".join(also_listed))
                if components:
                    course_loader.add_value("components", " ".join(components))

            courses.append(course_loader.load_item())

        subject_loader.add_value("courses", courses)
        yield subject_loader.load_item()
