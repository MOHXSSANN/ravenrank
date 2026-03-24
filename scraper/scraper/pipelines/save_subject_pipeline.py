import io

from scrapy.exceptions import DropItem
from scrapy.exporters import JsonItemExporter

from scraper.items import Subject
from scraper.settings import filesystem


class SaveSubjectPipeline:
    def __init__(self):
        self.subjects_buffer = io.BytesIO()
        self.subjects = JsonItemExporter(self.subjects_buffer)
        self.subjects.start_exporting()
        self.saved_items = 0

    def process_item(self, subject, spider):
        if not isinstance(subject, Subject):
            return subject

        subject.setdefault("courses", [])

        for course in subject["courses"]:
            course.setdefault("description", "")
            course.setdefault("components", "")
            course.setdefault("prerequisites", "")
            course.setdefault("precludes", "")
            course.setdefault("also_listed_as", "")

        self.subjects.export_item(subject)
        self.saved_items += 1

        raise DropItem()

    def close_spider(self, spider):
        if self.saved_items == 0:
            return

        self.subjects.finish_exporting()
        filesystem.put("subjects.json", self.subjects_buffer.getvalue().decode())
        self.subjects_buffer.close()
