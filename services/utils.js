import readline from "readline";
import axios from "axios";

//fucntion for input
export function askQuestion(query) {
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

// Random delay function to prevent getting banned
export function randomDelay(min = 1000, max = 2000) {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.random() * (max - min) + min)
  );
}

// Scroll the sidebar
export async function autoScrollResults(page) {
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
  console.log("✔  Finished scrolling sidebar");
}

export async function setConfig(page) {
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

  //set view port
  await page.setViewport({ width: 1280, height: 800 });
}

export function formatDate(dateStr) {
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6)}`;
}

export async function getSuggestions(query) {
  const url = `http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
    query
  )}`;
  const { data } = await axios.get(url);
  const suggestions = data[1];
  console.log(suggestions);
}

export async function autoScrollYoutube(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let distance = 100;
      let scrollTries = 0;

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          scrollTries++;
        } else {
          scrollTries = 0;
        }

        if (scrollTries > 3) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}
