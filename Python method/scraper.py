import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
import os
import sys


visited = set()


def clean_text(text):
    """Clean and normalize extracted text."""
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def is_valid_page(url, base_domain):
    """Check whether a URL belongs to the same website."""
    parsed = urlparse(url)

    if parsed.scheme not in ["http", "https"]:
        return False

    domain = parsed.netloc.lower()

    return domain == base_domain or domain.endswith("." + base_domain)


def is_excluded_file(url):
    """Ignore files that aren't useful for text scraping."""
    excluded_extensions = [
        ".png", ".jpg", ".jpeg", ".gif", ".svg",
        ".pdf", ".doc", ".docx",
        ".xls", ".xlsx", ".csv",
        ".zip", ".rar", ".mp3", ".mp4",
        ".avi", ".mov"
    ]

    path = urlparse(url).path.lower()

    return any(path.endswith(ext) for ext in excluded_extensions)


def scrape_and_save(url, output_file, base_domain):
    """Scrape a page and recursively follow internal links."""

    if url in visited:
        return

    if not is_valid_page(url, base_domain):
        return

    if is_excluded_file(url):
        return

    visited.add(url)

    try:
        print(f"Scraping: {url}")

        response = requests.get(
            url,
            timeout=15,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; WebScraper/1.0)"
            }
        )

        if response.status_code != 200:
            print(f"Skipping {url}: HTTP {response.status_code}")
            return

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove elements that don't contain useful page text
        for element in soup(["script", "style", "noscript"]):
            element.decompose()

        page_text = clean_text(soup.get_text(" "))

        if len(page_text) > 100:
            with open(output_file, "a", encoding="utf-8") as file:
                file.write(
                    f"\n\n=== {url} ===\n\n"
                    f"{page_text}"
                )

        # Find links on the page
        links = soup.find_all("a", href=True)

        for link in links:
            next_url = urljoin(url, link["href"])

            # Remove URL fragments
            next_url = next_url.split("#")[0]

            if (
                next_url not in visited
                and is_valid_page(next_url, base_domain)
                and not is_excluded_file(next_url)
            ):
                scrape_and_save(
                    next_url,
                    output_file,
                    base_domain
                )

    except requests.RequestException as error:
        print(f"Request error for {url}: {error}")

    except Exception as error:
        print(f"Error scraping {url}: {error}")


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("python scraper.py <website-url>")
        print()
        print("Example:")
        print("python scraper.py https://example.com/")
        sys.exit(1)

    start_url = sys.argv[1]

    parsed_url = urlparse(start_url)

    if not parsed_url.netloc:
        print("Please provide a valid website URL.")
        sys.exit(1)

    base_domain = parsed_url.netloc.lower()

    # Remove www. so www.example.com and example.com
    # can be treated as the same domain.
    if base_domain.startswith("www."):
        base_domain = base_domain[4:]

    output_file = "scraped_data.txt"

    # Start a fresh output file
    with open(output_file, "w", encoding="utf-8") as file:
        file.write(
            f"=== SCRAPED DATA START ===\n"
            f"Website: {start_url}\n"
            f"Domain: {base_domain}\n"
        )

    scrape_and_save(
        start_url,
        output_file,
        base_domain
    )

    print()
    print("Scraping complete!")
    print(f"Pages scraped: {len(visited)}")
    print(f"Data saved to: {os.path.abspath(output_file)}")


if __name__ == "__main__":
    main()