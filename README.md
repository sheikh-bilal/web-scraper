# 🔍 Google Maps Business Scraper

Automate business data collection from Google Maps using Puppeteer. Quickly scrape names, addresses, contact details, and more — all exported to an Excel file.

---

## ✨ Features

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
node google-maps-scraper.js
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
