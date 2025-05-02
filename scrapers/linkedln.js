import puppeteer from "puppeteer";
import ExcelJS from "exceljs";
import { randomDelay, setConfig } from "../services/utils.js";

export async function linkedlnScraper() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  setConfig(page);

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );

  // Set up Excel workbook
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("LinkedIn Companies");

  sheet.columns = [
    { header: "Name", key: "name", width: 50 },
    { header: "Description", key: "description", width: 80 },
    { header: "Followers", key: "followers", width: 15 },
    { header: "URL", key: "url", width: 60 },
  ];

  try {
    await page.goto("https://www.linkedin.com/login", {
      waitUntil: "networkidle2",
    });

    await page.type("#username", process.env.LINKEDIN_EMAIL, { delay: 100 });
    await page.type("#password", process.env.LINKEDIN_PASS, { delay: 100 });
    await page.click("button[type='submit']");
    await page.waitForSelector('a[href*="linkedin.com/mynetwork"]', {
      timeout: 10000,
    });
    console.log("Logged in to LinkedIn");
    randomDelay(2000, 3000);

    const searchQuery = "marketing agencies";
    await page.goto(
      `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(
        searchQuery
      )}`,
      {
        waitUntil: "networkidle2",
      }
    );
    randomDelay(1500, 3000);

    await page.waitForSelector(".search-results-container", { timeout: 15000 });
    console.log("Search completed!");

    const companies = await page.$$eval(
      'ul[role="list"].list-style-none > li',
      (nodes) =>
        nodes.map((li) => {
          const nameAnchor = li.querySelector("span a[href*='/company/']");

          const name = nameAnchor?.innerText?.trim() || "N/A";
          const url = nameAnchor?.href || "N/A";

          const descEl = li.querySelector("p.entity-result__summary--2-lines");
          const description = descEl?.innerText?.trim() || "N/A";

          const followersMatch = li.innerText.match(/([\d,]+)\s+followers/);
          const followers = followersMatch ? followersMatch[1] : "N/A";

          return { name, description, followers, url };
        })
    );

    console.log("Data Fetched.. now writing..");

    companies.forEach((company, i) => {
      sheet.addRow(company);
      console.log(`✔ Scraped ${i + 1}/${companies.length}: ${company.name}`);
    });

    await workbook.xlsx.writeFile("output/linkedin.xlsx");
    console.log("✔  Data saved to output/linkedin.xlsx");
  } catch (err) {
    console.error("Error scraping LinkedIn:", err.message);
  } finally {
    await browser.close();
  }
}
