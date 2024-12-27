import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Manually define __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// Your existing code
import { readFileSync, writeFileSync, existsSync } from "fs";
import express, { json, urlencoded } from "express";
import { generate } from "randomstring";

const PORT = process.env.PORT || 5454;
const app = express();

// Set up views and view engine
app.set("views", join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware to parse incoming requests
app.use(json());
app.use(urlencoded({ extended: true }));

// Helper function to validate URLs
function isURL(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

// File to store URL mappings
const FILE_PATH = "urlHistory.json";

// Ensure the file exists before operations
if (!existsSync(FILE_PATH)) {
  writeFileSync(FILE_PATH, JSON.stringify([]));
}

// Route to render the main page
app.get("/", (req, res) => {
  res.render("index", { newURL: "" });
});

// Route to shorten URLs
app.post("/shorten", (req, res) => {
  const userURL = req.body.url;

  if (!isURL(userURL)) {
    return res.render("index", { newURL: "Please enter a valid URL!" });
  }

  try {
    const data = readFileSync(FILE_PATH, { encoding: "utf8" });
    const jsonData = JSON.parse(data);

    // Check if the URL already exists in the database
    const found = jsonData.find((item) => item.long === userURL);

    if (found) {
      const newShortURL = `https://url-shortner-application-kds1.onrender.com/${found.short}`;
      return res.render("index", { newURL: newShortURL });
    }

    // Generate a unique short string
    const rndString = generate(5);
    const newData = [...jsonData, { short: rndString, long: userURL }];

    // Write the new mapping to the file
    writeFileSync(FILE_PATH, JSON.stringify(newData));
    const newShortURL = `https://url-shortner-application-kds1.onrender.com/${rndString}`;
    res.render("index", { newURL: newShortURL });
  } catch (error) {
    console.error("Error:", error);
    res.render("index", { newURL: "Something went wrong! Please try again." });
  }
});

// Route to handle redirection
app.get("/:shortURL", (req, res) => {
  const userShortURL = req.params.shortURL;

  try {
    const data = readFileSync(FILE_PATH, { encoding: "utf8" });
    const jsonData = JSON.parse(data);

    const found = jsonData.find((item) => item.short === userShortURL);

    if (found) {
      return res.redirect(found.long);
    }

    res.status(404).send("Short URL not found.");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error.");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
