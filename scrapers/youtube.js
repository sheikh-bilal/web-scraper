// youtube-scraper.mjs or set "type": "module" in package.json

import youtube from "youtube-sr";
import puppeteer from "puppeteer";
import axios from "axios";
import { exec } from "child_process";
import minimist from "minimist";

const args = minimist(process.argv.slice(2));

// Basic YouTube Search
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

// Trending Scraper
async function scrapeTrending(countryCode = "US") {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://www.youtube.com/feed/trending?gl=${countryCode}`, {
    waitUntil: "networkidle2",
  });

  const videos = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll("h3 a"));
    return titles.slice(0, 10).map((el) => ({
      title: el.textContent.trim(),
      url: "https://www.youtube.com" + el.getAttribute("href"),
    }));
  });

  console.log(videos);
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
        description: metadata.description?.substring(0, 200),
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

// CLI Entry Point
if (args.search) {
  searchVideos(args.search, args.limit || 10);
} else if (args.trending) {
  scrapeTrending(args.trending.toUpperCase());
} else if (args.suggest) {
  getSuggestions(args.suggest);
} else if (args.deepmeta) {
  getVideoMetadata(args.deepmeta);
} else {
  console.log(`
Usage:
  --search "keyword"         Search YouTube videos
  --trending "COUNTRY"       Get trending videos (e.g., US, IN)
  --suggest "query"          Get YouTube autocomplete suggestions
  --deepmeta "video_url"     Get advanced metadata using yt-dlp

Examples:
  node youtube-scraper.mjs --search="vlogging tips"
  node youtube-scraper.mjs --trending=PK
  node youtube-scraper.mjs --suggest="desi food"
  node youtube-scraper.mjs --deepmeta="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
`);
}
