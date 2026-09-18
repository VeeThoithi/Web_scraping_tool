const puppeteer = require("puppeteer");
const fs = require("fs");
const cron = require("node-cron");

const visited = new Set();
const outputFile = "mut_puppeteer_data.txt";

async function scrapePage(page, url) {
  if (visited.has(url)) return;
  visited.add(url);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const text = await page.evaluate(() => document.body.innerText);
    if (text.length > 100) {
      fs.appendFileSync(outputFile, `\n\n=== ${url} ===\n\n${text}`);
    }

    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a"), (a) => a.href)
    );

    const internalLinks = links.filter(
      (link) =>
        link.includes("mut.ac.ke") &&
        !visited.has(link) &&
        !link.match(/\.(jpg|jpeg|png|pdf|docx|zip)$/i)
    );

    for (let link of internalLinks) {
      await scrapePage(page, link);
    }
  } catch (e) {
    console.error(`⚠️ Failed to scrape ${url}: ${e.message}`);
  }
}

async function runScraper() {
  visited.clear(); // reset visited for each run
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await scrapePage(page, "https://www.mut.ac.ke/");

  await browser.close();
  console.log(`✅ Scrape finished! Data saved in "${outputFile}"`);
}

// Run immediately once
runScraper();

// Schedule with cron ⏰
// Example: run every day at midnight
cron.schedule("0 0 * * *", () => {
  console.log("⏳ Running scheduled scrape...");
  runScraper();
});
