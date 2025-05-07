# 🔍 Web Scrapers

Automate business and media data collection from **Google Maps**, **LinkedIn**, and **YouTube** using Puppeteer and other powerful tools. Extract valuable information like company details, social profiles, and trending or searched video insights — all exported to structured Excel files.

---

## ✨ Features

---

### 📍 Google Maps Scraper

- 🧠 Interactive: Prompt-based input for search term and headless mode
- 🗺️ Automates Google Maps navigation and result scraping
- 📜 Smart scrolling to capture full listings
- 📥 Extracts:
  - 🏢 Business Name
  - 📍 Address
  - 📞 Phone Number
  - 🌐 Website
  - ⭐ Rating
  - 🗣️ Number of Reviews
  - 🔗 Business URL
- 📊 Exports clean data to `output/google_output.xlsx`

---

### 🔗 LinkedIn Company Scraper

- 🔐 Automates login to LinkedIn
- 🔍 Searches for companies based on a keyword (e.g., "Marketing Agencies")
- 📥 Extracts:
  - 🏢 Company Name
  - 📍 Description
  - 📈 Number of Followers
  - 🔗 LinkedIn Profile URL
- 📊 Saves results to `output/linkedin_output.xlsx`

---

### 🎥 YouTube Scraper

#### 1. **Search Videos**

- 🔍 Search YouTube using keywords
- 📥 Extracts:
  - 🎬 Title
  - 🔗 Video URL
  - 👁️ Views
  - ⏳ Duration
  - 📆 Uploaded (relative time)
  - 📺 Channel Name
- 📊 Saved to: `output/search-youtube-<timestamp>.xlsx`

#### 2. **Trending Videos**

- 🌍 Scrape regional trending videos (e.g., US, IN)
- 🔎 Filter by:
  - All videos
  - Only Shorts
  - Only Regular Videos
- 📥 Metadata Includes:
  - 🎬 Title
  - 📺 Uploader
  - ⏱️ Duration
  - 👁️ Views
  - 👍 Likes
  - 🗓️ Upload Date
  - 🏷️ Tags
  - 🗂️ Categories
  - 🔗 Video URL
  - 🖼️ Thumbnail URL
  - 📝 Short Description
- 📊 Saved to: `output/trending-youtube-<timestamp>.xlsx`, `output/trending-youtube-<timestamp>.json (data analysis)`

#### 3. **Video Suggestions**

- 💡 Get YouTube autocomplete suggestions for a given query
- Useful for SEO, keyword research, and content planning

#### 4. **Deep Metadata (Single Video)**

- 🔎 Extract full video metadata using `yt-dlp`
- Outputs a full object with tags, likes, categories, and more

---

## 🔧 Requirements

- [Node.js](https://nodejs.org/) (v14+ recommended)
- `yt-dlp` (must be installed and available in PATH for YouTube metadata)
- npm (comes with Node.js)

Install all dependencies:

```bash
npm install
```

---

## 🚀 Usage

Run the main scraper interface:

```bash
node web-scraper.js
```

You’ll be prompted to select:

- A search term
- Whether to run in headless mode
- The data source:
  - `google`
  - `linkdln`
  - `youtube`

If you choose YouTube, you'll be offered:

- `search` – Search videos by keyword
- `trending` – Scrape trending videos by country
- `suggest` – Get autocomplete suggestions
- `deepmeta` – Fetch advanced video metadata

---

## 📁 Output

### 📍 Google Scraper

`📄 output/google_output.xlsx`

| Name | Address | Phone | Website | Rating | Reviews | URL |
| ---- | ------- | ----- | ------- | ------ | ------- | --- |

---

### 🔗 LinkedIn Scraper

`📄 output/linkedin_output.xlsx`

| Company Name | Description | Followers | URL |
| ------------ | ----------- | --------- | --- |

---

### 🎥 YouTube Scraper

`📄 output/search-youtube-*.xlsx`, `trending-youtube-*.xlsx`, `trending-youtube-*.json`

| Title | Uploader | Views | Duration | Upload Date | Tags | Categories | URL | Description | Likes | Thumbnail |
| ----- | -------- | ----- | -------- | ----------- | ---- | ---------- | --- | ----------- | ----- | --------- |

---

## ⚠️ Disclaimer

This project is intended for **educational and research purposes only**. Ensure you comply with the Terms of Service of platforms like:

- [Google Maps](https://maps.google.com/help/terms_maps/)
- [YouTube](https://www.youtube.com/t/terms)
- [LinkedIn](https://www.linkedin.com/legal/user-agreement)

---

## 👨🏻‍💻 Developer

**Bilal Ahmed (reply2bilal.ahmed@gmail.com)**
