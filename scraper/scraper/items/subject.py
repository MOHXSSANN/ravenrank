import scrapy
from itemloaders.processors import MapCompose, TakeFirst

from scraper.helpers import normalize_string


class Subject(scrapy.Item):
    title = scrapy.Field(
        input_processor=MapCompose(normalize_string),
        output_processor=TakeFirst(),
    )
    code = scrapy.Field(
        input_processor=MapCompose(normalize_string, str.upper),
        output_processor=TakeFirst(),
    )
    faculty = scrapy.Field(
        input_processor=MapCompose(normalize_string),
        output_processor=TakeFirst(),
    )
    school = scrapy.Field(
        input_processor=MapCompose(normalize_string),
        output_processor=TakeFirst(),
    )
    courses = scrapy.Field()
