import ytSearch from "yt-search";
import puppeteer from "puppeteer";
import axios from "axios";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { exec as _exec } from "child_process";
import { promisify } from "util";
import { askQuestion } from "../services/utils.js";

const exec = promisify(_exec);

function formatDate(dateStr) {
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6)}`;
}

async function searchVideos(keyword) {
  const result = await ytSearch(keyword);
  const videos = result.videos;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("YouTube Search");

  worksheet.columns = [
    { header: "Title", key: "title", width: 100 },
    { header: "URL", key: "url", width: 60 },
    { header: "Views", key: "views", width: 15 },
    { header: "Uploaded", key: "uploaded", width: 15 },
    { header: "Channel", key: "channel", width: 30 },
    { header: "Duration", key: "duration", width: 10 },
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
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://www.youtube.com/feed/trending?gl=${countryCode}`, {
    waitUntil: "networkidle2",
  });

  const videoHandles = await page.$$("h3 a");
  console.log(`Scraping top 10 trending clips in ${countryCode}...\n`);

  const urls = [];
  let collected = 0;
  const limit = 10;
  for (let i = 0; i < videoHandles.length && collected < limit; i++) {
    const href = await page.evaluate(
      (el) => el.getAttribute("href"),
      videoHandles[i]
    );
    const url = `https://www.youtube.com${href}`;
    if (
      filterType === "all" ||
      (filterType === "shorts" && url.includes("/shorts/")) ||
      (filterType === "videos" && url.includes("/watch?v="))
    ) {
      urls.push(url);
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
}

// Auto-Suggestions
async function getSuggestions(query) {
  const url = `http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
    query
  )}`;
  const { data } = await axios.get(url);
  const suggestions = data[1];
  console.log(suggestions);
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
    `Choose YouTube action (search / trending / suggest / deepmeta): `
  );
  switch (action.toLowerCase()) {
    case "search": {
      const keyword = await askQuestion("Enter search keyword: ");
      await searchVideos(keyword, 10);
      break;
    }
    case "trending": {
      const country = await askQuestion("Enter country code (e.g US): ");
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
      const url = await askQuestion("YouTube video URL: ");
      await getVideoMetadata(url);
      break;
    }
    default:
      console.log(`
        Usage:
          --search "keyword"         Search YouTube videos
          --trending "COUNTRY"       Get trending videos (e.g., US, IN)
          --suggest "query"          Get YouTube autocomplete suggestions
          --deepmeta "video_url"     Get advanced metadata using yt-dlp
        
        Examples:
          --search="vlogging tips"
          --trending=PK
          --suggest="desi food"
          --deepmeta="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      `);
  }
}
