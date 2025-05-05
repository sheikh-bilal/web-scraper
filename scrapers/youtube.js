import youtube from "youtube-sr";
import puppeteer from "puppeteer";
import axios from "axios";
import { exec } from "child_process";
import { askQuestion } from "../services/utils.js";

async function searchVideos(keyword, limit = 10) {
  const results = await youtube.search(keyword, { limit });
  results.forEach((video) => {
    console.log({
      title: video.title,
      url: `https://youtube.com/watch?v=${video.id}`,
      views: video.views,
      uploaded: video.uploadedAt,
      channel: video.channel.name,
      duration: video.durationFormatted,
    });
  });
}

// Trending videos scraping
async function scrapeTrending(countryCode = "US") {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://www.youtube.com/feed/trending?gl=${countryCode}`, {
    waitUntil: "networkidle2",
  });

  const videoHandles = await page.$$("h3 a");
  const maxVideos = Math.min(10, videoHandles.length);
  console.log(
    `Scraping top ${maxVideos} trending videos in ${countryCode}...\n`
  );

  for (let i = 0; i < maxVideos; i++) {
    const handle = videoHandles[i];

    const title = await page.evaluate((el) => el.textContent.trim(), handle);
    const href = await page.evaluate((el) => el.getAttribute("href"), handle);
    const url = `https://www.youtube.com${href}`;

    console.log(`Scraped ${i + 1}/${maxVideos}:`);
    console.log(`  Title: ${title}`);
    console.log(`  URL:   ${url}`);
    console.log("--------------------------------------------------");

    await new Promise((res) => setTimeout(res, 300));
  }
  await browser.close();
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
function getVideoMetadata(videoUrl) {
  const command = `yt-dlp -j "${videoUrl}"`;

  console.log("--------------------------------------------------");
  console.log(`Scraping metaData for ${videoUrl}...`);
  console.log("--------------------------------------------------");

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`yt-dlp error: ${error.message}`);
      return;
    }
    try {
      const metadata = JSON.parse(stdout);
      console.log({
        title: metadata.title,
        uploader: metadata.uploader,
        duration: metadata.duration,
        tags: metadata.tags,
        views: metadata.view_count,
        likes: metadata.like_count,
        upload_date: metadata.upload_date,
        description: metadata.description?.substring(),
        thumbnail: metadata.thumbnail,
        categories: metadata.categories,
        subtitles: metadata.subtitles,
        formats: metadata.formats?.map((f) => f.format_note).filter(Boolean),
      });
    } catch (parseErr) {
      console.error("Error parsing yt-dlp output:", parseErr);
    }
  });
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
      await scrapeTrending((country || "US").toUpperCase());
      break;
    }
    case "suggest": {
      const query = await askQuestion("Enter suggestion query: ");
      await getSuggestions(query);
      break;
    }
    case "deepmeta": {
      const url = await askQuestion("YouTube video URL: ");
      getVideoMetadata(url);
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
