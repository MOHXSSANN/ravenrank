import os

import dotenv

from scraper import helpers

dotenv.load_dotenv()

BOT_NAME = "scraper"

SPIDER_MODULES = ["scraper.spiders"]
NEWSPIDER_MODULE = "scraper.spiders"

ROBOTSTXT_OBEY = False

CONCURRENT_REQUESTS = 32
DOWNLOAD_DELAY = 0.5

COOKIES_ENABLED = True

ITEM_PIPELINES = {
    "scraper.pipelines.SaveSubjectPipeline": 500,
}

REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"

LOG_ENABLED = False

# Playwright handlers — only enabled when scrapy-playwright is installed
# (needed for RMP spider, not for course catalog spider)
try:
    import scrapy_playwright  # noqa: F401
    DOWNLOAD_HANDLERS = {
        "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
    }
    PLAYWRIGHT_LAUNCH_OPTIONS = {
        "headless": False,
        "timeout": 20 * 1000,  # 20 seconds
    }
except ImportError:
    pass

OUTPUT_DIR = os.getenv("OUTPUT_DIR", os.path.join(os.path.dirname(__file__), "..", "data"))
filesystem = helpers.LocalFilesystem(OUTPUT_DIR)
