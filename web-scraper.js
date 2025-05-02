import dotenv from "dotenv";
dotenv.config();
import { googleMapsScraper } from "./scrapers/googleMaps.js";
import { linkedlnScraper } from "./scrapers/linkedln.js";
import { askQuestion } from "./services/utils.js";

const source = await askQuestion("Choose scraping-source (google/linkedln): ");
if (source.toLowerCase() === "google") {
  console.log("Searching... please wait!");
  await googleMapsScraper();
} else if (source.toLowerCase() === "linkedln") {
  console.log("Navigating to LinkedIn login page");
  await linkedlnScraper();
} else {
  console.log("Invalid option. Please choose either 'google' or 'linkedin'.");
}
