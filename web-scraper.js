import { googleMapsScraper } from "./scrapers/googleMaps.js";
import { askQuestion } from "./services/utils.js";

// User Input
let count = 0;
const searchTerm = await askQuestion(
  "Enter search term (e.g. Doctors in Lahore): "
);
const headlessInput = await askQuestion("Run in headless mode? (yes/no): ");
const isHeadless = headlessInput.trim().toLowerCase() === "yes";

const source = await askQuestion("Choose source (google/linkedin): ");
if (source.toLowerCase() === "google") {
  console.log("Searching... please wait!");
  await googleMapsScraper(isHeadless, searchTerm, count);
} else if (source.toLowerCase() === "linkedin") {
  await scrapeLinkedIn();
  console.log("Searching... please wait!");
} else {
  console.log("Invalid option. Please choose either 'google' or 'linkedin'.");
}
