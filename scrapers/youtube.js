import ytSearch from "yt-search";
import puppeteer from "puppeteer";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { exec as _exec } from "child_process";
import { promisify } from "util";
import {
  askQuestion,
  formatDate,
  getSuggestions,
  autoScrollYoutube,
} from "../services/utils.js";

const exec = promisify(_exec);

async function searchVideos(keyword) {
  const result = await ytSearch(keyword);
  const videos = result.videos;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("YouTube Search");

  worksheet.columns = [
    { header: "Title", key: "title", width: 100 },
    { header: "URL", key: "url", width: 50 },
    { header: "Views", key: "views", width: 15 },
    { header: "Uploaded", key: "uploaded", width: 30 },
    { header: "Channel", key: "channel", width: 30 },
    { header: "Duration", key: "duration", width: 15 },
  ];

  videos.forEach((video, i) => {
    console.log(`✔  Fetching result #${i + 1}: ${video.url}`);
    worksheet.addRow({
      title: video.title,
      url: video.url,
      views: video.views,
      uploaded: video.ago,
      channel: video.author.name,
      duration: video.timestamp,
    });
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });

  const outputDir = path.resolve("output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `output/search-youtube-${timestamp}.xlsx`;

  await workbook.xlsx.writeFile(filename);
  console.log(`✔  Results saved to file: ${filename}`);
}

// Trending videos scraping
async function scrapeTrending(countryCode = "US", filterType = "all") {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(`https://www.youtube.com/feed/trending?gl=${countryCode}`, {
    waitUntil: "networkidle2",
  });

  await autoScrollYoutube(page);

  const videoHandles = await page.$$("h3 a");
  console.log(
    `Scraping top ${videoHandles.length} trending clips in ${countryCode}...\n`
  );

  const urls = [];
  let collected = 0;
  const seen = new Set();
  const limit = 50;
  for (let i = 0; i < videoHandles.length && collected < limit; i++) {
    const href = await page.evaluate(
      (el) => el.getAttribute("href"),
      videoHandles[i]
    );
    if (!href) continue;

    let videoId = null;
    if (href.includes("/watch?v=")) {
      const match = href.match(/v=([^&]+)/);
      if (match) videoId = match[1];
    } else if (href.includes("/shorts/")) {
      const match = href.match(/\/shorts\/([^/?&]+)/);
      if (match) videoId = match[1];
    }

    if (!videoId || seen.has(videoId)) continue;

    seen.add(videoId);
    const cleanUrl = href.startsWith("http")
      ? href.split("&")[0]
      : `https://www.youtube.com${href.split("&")[0]}`;

    if (
      filterType === "all" ||
      (filterType === "shorts" && cleanUrl.includes("/shorts/")) ||
      (filterType === "videos" && cleanUrl.includes("/watch?v="))
    ) {
      urls.push(cleanUrl);
      collected++;
    }
  }

  //browser closed
  await browser.close();

  const records = [];
  for (let i = 0; i < urls.length; i++) {
    console.log(`✔  Fetching metadata for #${i + 1}: ${urls[i]}`);
    const meta = await getVideoMetadata(urls[i]);
    if (meta) records.push(meta);
    await new Promise((r) => setTimeout(r, 300));
  }

  // Create output directory if it doesn't exist
  const outputDir = path.resolve("output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  //save to file
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Trending YouTube");

  ws.columns = [
    { header: "Title", key: "title", width: 80 },
    { header: "Uploader", key: "uploader", width: 25 },
    { header: "Duration(s)", key: "duration", width: 15 },
    { header: "Views", key: "views", width: 15 },
    { header: "Likes", key: "likes", width: 15 },
    { header: "Upload Date", key: "upload_date", width: 15 },
    { header: "Tags", key: "tags", width: 50 },
    { header: "Categories", key: "categories", width: 30 },
    { header: "URL", key: "url", width: 55 },
    { header: "Thumbnail", key: "thumbnail", width: 55 },
    { header: "Description", key: "description", width: 100 },
  ];

  records.forEach((record) => ws.addRow(record));

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(outputDir, `trending-youtube-${timestamp}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  console.log(`✔  Excel file saved to: ${filePath}`);

  const jsonPath = path.join(outputDir, `trending-youtube-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2));
  console.log(`✔  JSON file saved to: ${jsonPath}`);
}

// Deep Metadata using yt-dlp
async function getVideoMetadata(videoUrl) {
  const command = `yt-dlp -j "${videoUrl}"`;

  try {
    const { stdout } = await exec(command);
    const metadata = JSON.parse(stdout);
    return {
      title: metadata.title,
      uploader: metadata.uploader,
      duration: metadata.duration,
      tags: (metadata.tags || []).join(", "),
      categories: (metadata.categories || []).join(", "),
      views: metadata.view_count,
      likes: metadata.like_count,
      upload_date: formatDate(metadata.upload_date),
      description: metadata.description?.substring(0, 300) + "…",
      thumbnail: metadata.thumbnail,
      url: videoUrl,
    };
  } catch (err) {
    console.error(`Error fetching metadata for ${videoUrl}:`, err);
    return null;
  }
}

export async function youtubeScraper() {
  const action = await askQuestion(
    `Choose a YouTube action:\n  • search\n  • trending\n  • suggest\n  • deepmeta\n\nYour choice: `
  );

  switch (action.toLowerCase()) {
    case "search": {
      const keyword = await askQuestion("Enter search keyword: ");
      await searchVideos(keyword, 10);
      break;
    }

    case "trending": {
      const country = await askQuestion("Enter country code (e.g. US): ");
      const type = await askQuestion("Select type (videos | shorts | all): ");
      await scrapeTrending((country || "US").toUpperCase(), type.toLowerCase());
      break;
    }

    case "suggest": {
      const query = await askQuestion("Enter suggestion query: ");
      await getSuggestions(query);
      break;
    }

    case "deepmeta": {
      const url = await askQuestion("🔗 Enter YouTube video URL: ");
      await getVideoMetadata(url);
      break;
    }

    default:
      console.log(`
❌ Invalid option. Available actions:

  --search           Search YouTube videos
  --trending         Get trending videos (e.g., US, IN)
  --suggest          Get YouTube autocomplete suggestions
  --deepmeta         Get advanced metadata using yt-dlp`);
  }
}
