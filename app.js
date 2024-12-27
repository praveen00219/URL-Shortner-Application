const path = require("path");
const fs = require("fs");
const express = require("express");
const randomstring = require("randomstring");

const PORT = process.env.PORT || 5454;
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function isURL(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

app.get("/", (req, res) => {
  res.render("index", { newURL: "" });
});

app.post("/shorten", (req, res) => {
  console.log(req.body);
  const userURL = req.body.url;
  if (!isURL(userURL)) {
    res.render("index", { newURL: "Please enter a valid URL!" });
  } else {
    const rndString = randomstring.generate(5);

    //reading from file
    const data = fs.readFileSync("urlHistory.json", { encoding: "utf8" });
    const jsonData = JSON.parse(data);

    const found = jsonData.find((item) => item.long === userURL);

    if (!found) {
      const newData = [...jsonData, { short: rndString, long: userURL }];
      //writing to the file
      try {
        fs.writeFileSync("urlHistory.json", JSON.stringify(newData));
      } catch (error) {
        res.render("index", { newURL: "Something went wrong!" });
      }
    } else {
      const newShortURL = `https://url-shortner-api-qaut.onrender.com/${found.short}`;
      res.render("index", { newURL: newShortURL });
    }
  }
});

app.get("/:shortURL", (req, res) => {
  const userShortURL = req.params.shortURL;
  //reading from file
  const data = fs.readFileSync("urlHistory.json", { encoding: "utf8" });
  const jsonData = JSON.parse(data);
  const found = jsonData.find((item) => item.short === userShortURL);
  res.redirect(found.long);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
