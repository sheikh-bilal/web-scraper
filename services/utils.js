import readline from "readline";
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
  console.log("Finished scrolling sidebar");
}
