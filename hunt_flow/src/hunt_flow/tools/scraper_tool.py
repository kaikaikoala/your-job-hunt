import asyncio
from crewai.tools import tool
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig, CacheMode

@tool("smart_scraper")
def smart_scraper(url: str) -> str:
    """Scrapes a URL and returns clean Markdown."""

    async def scrape():
        # 1. Configure the Browser (Make it look more like a real user)
        browser_config = BrowserConfig(
            headless=True,
            browser_type="chromium"
        )

        # 2. Configure the Run (The 'Wait' Strategy)
        run_config = CrawlerRunConfig(
            # CHANGE TO: 
            wait_until="networkidle", # Wait for the page to stop loading data
            # Add a generic wait for the body tag (every site has one)
            wait_for="css:body",
            # Increase the delay slightly to allow for slow JavaScript redirects
            delay_before_return_html=3.0,
            cache_mode=CacheMode.BYPASS,
            # Force the crawler to handle modern JS better
            magic=True
        )
        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(url=url, config=run_config)
            if result.success:
                return result.markdown
            return f"Error: {result.error_message}"

    return asyncio.run(scrape())
