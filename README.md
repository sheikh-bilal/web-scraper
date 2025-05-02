# 🔍 Web Scrapers

Automate business data collection from **Google Maps** and **LinkedIn** using Puppeteer. Quickly scrape company and business data, including names, addresses, contact details, ratings, and more — all exported to an Excel file.

---

## ✨ Features

### Google Maps Scraper

- 🧠 Interactive: Prompt-based input for search term and headless mode
- 🗺️ Google Maps navigation and search automation
- 📜 Smart scrolling to load all sidebar results
- 📥 Extracts:
  - 🏢 Business Name
  - 📍 Address
  - 📞 Phone Number
  - 🌐 Website
  - ⭐ Rating
  - 🗣️ Number of Reviews
  - 🔗 Business URL
- 🧼 Cleans unwanted icons and formatting
- 📊 Exports clean data to `output.xlsx`

### LinkedIn Scraper

- 🧠 Login automation for LinkedIn
- 🔍 Search companies based on query (e.g., "Marketing Agencies")
- 📥 Extracts:
  - 🏢 Company Name
  - 📍 Description
  - 📈 Number of Followers
  - 🔗 LinkedIn URL
- 📊 Exports clean data to `output/linkedin_output.xlsx`

---

## 🔧 Requirements

- [Node.js](https://nodejs.org/) (v14+ recommended)
- npm (comes with Node.js)

Install dependencies:

```bash
npm install
```

---

## 🚀 Usage

Run the script:

```bash
node web-scraper.js
```

🔸 You'll be prompted to enter:

- A search term (e.g. `Restaurants in Lahore`)
- Whether to run in headless mode (`true` or `false`)

---

## 📁 Output

Results are saved to:

```plaintext
📄 output.xlsx
```

With columns:

| 🏢 Name | 📍 Address | 📞 Phone | 🌐 Website | ⭐ Rating | 🗣️ Reviews | 🔗 URL |
| ------- | ---------- | -------- | ---------- | --------- | ---------- | ------ |

---

## ⚠️ Disclaimer

This script is for **educational and research purposes** only. Ensure your usage complies with [Google Maps Terms of Service](https://maps.google.com/help/terms_maps/).

---

## 📄 License

MIT License

## 👨🏻‍💻 Developer

Bilal Ahmed
