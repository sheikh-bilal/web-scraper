const puppeteer = require("puppeteer");
const ExcelJS = require("exceljs");
const readline = require("readline");
let count = 0;
// Random delay function to prevent getting banned
function randomDelay(min = 1000, max = 2000) {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.random() * (max - min) + min)
  );
}

//fucntion for input
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

// Scroll the sidebar
async function autoScrollResults(page) {
  let previousHeight = 0;
  let unchangedScrolls = 0;

  while (unchangedScrolls < 3) {
    const currentHeight = await page.evaluate(() => {
      const scrollable = document.querySelector('div[role="feed"]');
      if (scrollable) {
        scrollable.scrollBy(0, 1000);
        return scrollable.scrollHeight;
      }
      return 0;
    });

    if (currentHeight === previousHeight) {
      unchangedScrolls++;
    } else {
      unchangedScrolls = 0;
      previousHeight = currentHeight;
    }

    await randomDelay(2000, 3500);
  }

  console.log("Finished scrolling sidebar");
}

(async () => {
  const searchTerm = await askQuestion(
    "Enter search term (e.g. Doctors in Lahore): "
  );
  const headlessInput = await askQuestion("Run in headless mode? (yes/no): ");
  const isHeadless = headlessInput.trim().toLowerCase() === "yes";
  console.log("Searching... please wait!");

  const browser = await puppeteer.launch({ headless: isHeadless });
  const page = await browser.newPage();

  //cache and cookies clear
  const client = await page._client();
  await client.send("Network.clearBrowserCookies");
  await client.send("Network.clearBrowserCache");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  page.on("load", async () => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  await page.setViewport({ width: 1280, height: 800 });

  await page.goto("https://maps.google.com", { waitUntil: "domcontentloaded" });
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
      timeout: 5000,
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
  console.log(`Found ${businessLinks.length} businesses`);

  // Prepare Excel workbook
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Businesses");
  sheet.columns = [
    { header: "Name", key: "name", width: 70 },
    { header: "Address", key: "address", width: 100 },
    { header: "Phone", key: "phone", width: 20 },
    { header: "Website", key: "website", width: 40 },
    { header: "Rating", key: "rating", width: 10 },
    { header: "Reviews", key: "reviews", width: 10 },
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
    } catch {
      data.website = "N/A";
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
    console.log(`Scraped ${count}/${businessLinks.length}: ${data.name}`);
    await detailPage.close();
    await randomDelay(2000, 3500);
  }

  // Save to File
  await workbook.xlsx.writeFile("output.xlsx");
  console.log("Data saved to output.xlsx");

  await browser.close();
})();
