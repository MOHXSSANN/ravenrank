import scrapy
from itemloaders.processors import Compose, Join, MapCompose, TakeFirst

from scraper.helpers import normalize_string, normalize_whitespace, remove_whitespace


class Course(scrapy.Item):
    title = scrapy.Field(
        input_processor=Compose(Join(" "), normalize_whitespace),
        output_processor=TakeFirst(),
    )
    code = scrapy.Field(
        input_processor=MapCompose(normalize_string, remove_whitespace, str.upper),
        output_processor=TakeFirst(),
    )
    credits = scrapy.Field(
        input_processor=MapCompose(normalize_string),
        output_processor=TakeFirst(),
    )
    description = scrapy.Field(
        input_processor=Compose(Join(" "), normalize_whitespace),
        output_processor=TakeFirst(),
    )
    components = scrapy.Field(
        input_processor=Compose(Join(" "), normalize_whitespace),
        output_processor=TakeFirst(),
    )
    prerequisites = scrapy.Field(
        input_processor=Compose(Join(" "), normalize_whitespace),
        output_processor=TakeFirst(),
    )
    precludes = scrapy.Field(
        input_processor=Compose(Join(" "), normalize_whitespace),
        output_processor=TakeFirst(),
    )
    also_listed_as = scrapy.Field(
        input_processor=Compose(Join(" "), normalize_whitespace),
        output_processor=TakeFirst(),
    )
