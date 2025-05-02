import ExcelJS from "exceljs";
import puppeteer from "puppeteer";
import {
  autoScrollResults,
  randomDelay,
  askQuestion,
  setConfig,
} from "../services/utils.js";

let count = 0;

export async function googleMapsScraper() {
  const searchTerm = await askQuestion(
    "Enter search term (e.g. Doctors in Lahore): "
  );
  const headlessInput = await askQuestion("Run in headless mode? (yes/no): ");
  const isHeadless = headlessInput.trim().toLowerCase() === "yes";

  const browser = await puppeteer.launch({ headless: isHeadless });
  const page = await browser.newPage();

  await setConfig(page);

  await page.goto("https://maps.google.com", { waitUntil: "networkidle2" });
  await randomDelay(2000, 5000);

  //if cookies
  try {
    const acceptBtn = await page.waitForSelector(
      'button[aria-label="Accept all"]',
      { timeout: 3000 }
    );
    await acceptBtn.click();
    await randomDelay();
  } catch (e) {}

  // Enter search term and search
  await page.waitForSelector("input#searchboxinput");
  await page.click("input#searchboxinput");
  await page.keyboard.type(searchTerm, { delay: 100 });

  await Promise.all([
    page.keyboard.press("Enter"),
    page.waitForSelector('a[href*="/place/"]', {
      timeout: 9000,
    }),
  ]);
  await randomDelay(2000, 3000);
  await autoScrollResults(page);

  // Extract business URLs from sidebar
  const businessLinks = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/place/"]'));
    const hrefs = anchors.map((a) => a.href.split("?")[0]);
    return Array.from(new Set(hrefs));
  });
  console.log(`✔  Found ${businessLinks.length} businesses`);

  // Prepare Excel workbook
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Businesses Details");
  sheet.columns = [
    { header: "Name", key: "name", width: 70 },
    { header: "Address", key: "address", width: 100 },
    { header: "Phone", key: "phone", width: 20 },
    { header: "Website", key: "website", width: 40 },
    { header: "Rating", key: "rating", width: 10 },
    { header: "Reviews", key: "reviews", width: 10 },
    { header: "Facebook", key: "fb", width: 50 },
    { header: "Instagram", key: "insta", width: 50 },
    { header: "Linkedln", key: "linkedln", width: 50 },
    { header: "URL", key: "url", width: 50 },
  ];

  // Scrape details for each business
  for (const url of businessLinks) {
    const detailPage = await browser.newPage();
    await detailPage.goto(url, { waitUntil: "domcontentloaded" });
    await randomDelay();

    const data = {};
    try {
      data.name = await detailPage.$eval("h1", (el) => el.innerText.trim());
    } catch {
      data.name = "N/A";
    }
    try {
      data.address = await detailPage.$eval(
        'button[data-item-id="address"] .Io6YTe',
        (el) => el.innerText.trim()
      );
    } catch {
      data.address = "N/A";
    }
    try {
      data.phone = await detailPage.$eval(
        'button[data-item-id^="phone"] .Io6YTe',
        (el) => el.innerText.trim()
      );
    } catch {
      data.phone = "N/A";
    }
    try {
      data.website = await detailPage.$eval(
        'a[data-item-id="authority"]',
        (el) => el.href
      );
      if (data.website && data.website !== "N/A") {
        try {
          const websitePage = await browser.newPage();
          await websitePage.goto(data.website, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });

          const links = await websitePage.$$eval("a", (anchors) =>
            anchors.map((a) => a.href)
          );

          data.fb =
            links.find((link) => link.includes("facebook.com")) || "N/A";
          data.insta =
            links.find((link) => link.includes("instagram.com")) || "N/A";
          data.linkedln =
            links.find((link) => link.includes("linkedin.com")) || "N/A";

          await websitePage.close();
        } catch (err) {
          data.fb = "N/A";
          data.insta = "N/A";
          data.linkedln = "N/A";
        }
      }
    } catch {
      data.website = "N/A";
      data.fb = "N/A";
      data.insta = "N/A";
      data.linkedln = "N/A";
    }
    try {
      data.rating = await detailPage.$eval("div.fontDisplayLarge", (el) =>
        el.innerText.trim()
      );
    } catch {
      data.rating = "N/A";
    }
    try {
      data.reviews = await detailPage.$eval("div.HHrUdb span", (el) => {
        const match = el.innerText.match(/\d+/);
        return match ? match[0] : "";
      });
    } catch {
      data.reviews = "N/A";
    }
    data.url = url;

    sheet.addRow(data);
    count++;
    console.log(`✔  Scraped ${count}/${businessLinks.length}: ${data.name} `);
    await detailPage.close();
    await randomDelay(2000, 3500);
  }

  // Save to File
  await workbook.xlsx.writeFile("output/output.xlsx");
  console.log("Data saved to output.xlsx ");
  count = 0;
  await browser.close();
}
