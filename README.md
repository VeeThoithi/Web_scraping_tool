{\rtf1}
# Web Scraping Comparison

A web scraping project demonstrating two approaches to extracting content from websites:

* **Python** — Requests + BeautifulSoup
* **Node.js** — Puppeteer

The project was originally built to scrape data from the Murang'a University of Technology (MUT) website and was later generalized to work with other websites.

## Features

* Accepts a website URL as input
* Crawls internal pages recursively
* Extracts and cleans webpage text
* Avoids duplicate URLs
* Skips images, PDFs, videos, and other non-page files
* Saves scraped content to a text file
* Includes a scheduled scraping option using `node-cron`

## Project Structure

```text
web_scraper/
├── python/
│   ├── scraper.py
│   └── requirements.txt
├── nodejs-puppeteer/
│   ├── scraper.js
│   ├── scheduled_scraper.js
│   ├── package.json
│   └── package-lock.json
├── examples/
├── .gitignore
└── README.md
```

## Python Scraper

Uses **Requests** to retrieve webpages and **BeautifulSoup** to parse and extract their text.

### Setup

```bash
cd python
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Run

```bash
python scraper.py https://example.com/
```

The scraped content is saved to `scraped_data.txt`.

## Node.js Puppeteer Scraper

Uses **Puppeteer** to launch a headless Chrome browser. This approach is useful for websites where content is rendered using JavaScript.

### Setup

```bash
cd nodejs-puppeteer
npm install
```

### Run

```bash
node puppeteer_scraper.js https://example.com/
```

The scheduled version can be run with:

```bash
node scheduled_scraper.js
```

Example Output: Sample scraped data is included in the examples/ directory.

## Python vs Puppeteer

| Python                         | Node.js + Puppeteer               |
| ------------------------------ | --------------------------------- |
| Lightweight                    | Browser-based                     |
| Faster for simple/static pages | Better for JavaScript-heavy pages |
| No browser required            | Uses Chrome                       |
| Requests + BeautifulSoup       | Puppeteer                         |

## Technologies

**Python:** Requests, BeautifulSoup

**Node.js:** Puppeteer, node-cron

## Responsible Use

This project is intended for educational purposes and publicly accessible websites. Always check a website's terms, `robots.txt`, and applicable rules before scraping.

## Author

**Venessa Thoithi**

