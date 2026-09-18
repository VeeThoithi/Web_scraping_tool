const puppeteer = require("puppeteer");
const fs = require("fs");
const { URL } = require("url");

const visited = new Set();

function isValidPage(url, baseDomain) {
    try {
        const parsedUrl = new URL(url);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return false;
        }

        const domain = parsedUrl.hostname.toLowerCase();

        return domain === baseDomain || domain.endsWith("." + baseDomain);
    } catch {
        return false;
    }
}

function isExcludedFile(url) {
    const excludedExtensions = [
        ".jpg", ".jpeg", ".png", ".gif", ".svg",
        ".pdf", ".doc", ".docx",
        ".xls", ".xlsx", ".csv",
        ".zip", ".rar",
        ".mp3", ".mp4", ".avi", ".mov"
    ];

    try {
        const pathname = new URL(url).pathname.toLowerCase();

        return excludedExtensions.some(extension =>
            pathname.endsWith(extension)
        );
    } catch {
        return true;
    }
}

async function scrapePage(page, url, baseDomain, outputFile) {
    if (visited.has(url)) return;
    if (!isValidPage(url, baseDomain)) return;
    if (isExcludedFile(url)) return;

    visited.add(url);

    try {
        console.log(`Scraping: ${url}`);

        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 60000
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const text = await page.evaluate(() => {
            document
                .querySelectorAll("script, style, noscript")
                .forEach(element => element.remove());

            return document.body.innerText
                .replace(/\s+/g, " ")
                .trim();
        });

        if (text.length > 100) {
            fs.appendFileSync(
                outputFile,
                `\n\n=== ${url} ===\n\n${text}`
            );
        }

        const links = await page.evaluate(() =>
            Array.from(
                document.querySelectorAll("a[href]"),
                link => link.href
            )
        );

        for (const link of links) {
            try {
                const absoluteUrl = new URL(link, url);
                absoluteUrl.hash = "";

                const nextUrl = absoluteUrl.href;

                if (
                    !visited.has(nextUrl) &&
                    isValidPage(nextUrl, baseDomain) &&
                    !isExcludedFile(nextUrl)
                ) {
                    await scrapePage(
                        page,
                        nextUrl,
                        baseDomain,
                        outputFile
                    );
                }
            } catch {
                // Ignore invalid URLs
            }
        }

    } catch (error) {
        console.error(
            `⚠️ Failed to scrape ${url}: ${error.message}`
        );
    }
}

async function main() {

    const startUrl = process.argv[2];

    if (!startUrl) {
        console.log("Usage: node puppeteer_scraper.js <website-url>");
        console.log(
            "Example: node puppeteer_scraper.js https://example.com/"
        );
        process.exit(1);
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(startUrl);
    } catch {
        console.error("Please provide a valid website URL.");
        process.exit(1);
    }

    let baseDomain = parsedUrl.hostname.toLowerCase();

    if (baseDomain.startsWith("www.")) {
        baseDomain = baseDomain.substring(4);
    }

    const outputFile = "scraped_data.txt";

    fs.writeFileSync(
        outputFile,
        `=== SCRAPED DATA START ===\n` +
        `Website: ${startUrl}\n` +
        `Domain: ${baseDomain}\n`
    );

    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();

    await scrapePage(
        page,
        startUrl,
        baseDomain,
        outputFile
    );

    await browser.close();

    console.log();
    console.log("✅ Scraping complete!");
    console.log(`Pages scraped: ${visited.size}`);
    console.log(`Data saved to: ${outputFile}`);
}

main();