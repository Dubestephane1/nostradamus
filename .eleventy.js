// .eleventy.js
const fs = require('fs');
const path = require('path');

module.exports = function (eleventyConfig) {
  console.log("[Eleventy] Config loaded - root:", __dirname);

  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("style.css");

  eleventyConfig.addNunjucksFilter("padStart", function (value, length, char) {
    const str = String(value == null ? "" : value);
    const pad = char !== undefined ? String(char) : "0";
    return str.padStart(length, pad);
  });

  // Build absolute URL for canonical/og:url (set URL in env for production)
  eleventyConfig.addNunjucksFilter("absoluteUrl", function (path) {
    const base = process.env.URL || "https://example.com";
    if (!path) return base;
    const baseTrimmed = base.replace(/\/$/, "");
    const pathTrimmed = path.startsWith("/") ? path : "/" + path;
    return baseTrimmed + pathTrimmed;
  });

  eleventyConfig.addCollection("quatrains", function () {
    console.log("[COLLECTION] Starting...");

    const dataDir = path.join(__dirname, "js", "data");
    const items = [];

    try {
      console.log("[COLLECTION] Checking dir:", dataDir);
      const files = fs.readdirSync(dataDir);
      console.log("[COLLECTION] Files:", files);

      files.forEach(file => {
        console.log("[COLLECTION] File:", file);

        if (file.endsWith(".json")) {
          const match = file.match(/century(\d+)\.json/i);
          console.log("[COLLECTION] Match result:", match);

          if (match) {
            const century = parseInt(match[1]);
            console.log("[COLLECTION] Century:", century);

            const filePath = path.join(dataDir, file);
            const content = fs.readFileSync(filePath, "utf8");
            const data = JSON.parse(content);

            const keys = Object.keys(data);
            console.log("[COLLECTION] Keys in file:", keys.slice(0, 5), "total", keys.length);

            keys.forEach(key => {
              const number = parseInt(key);
              if (!isNaN(number)) {
                items.push({
                  century,
                  number,
                  data: data[key]
                });
                if (items.length <= 5) {
                  console.log("[COLLECTION] Added:", century, number, key);
                }
              }
            });
          }
        }
      });

      console.log("[COLLECTION] Total items:", items.length);
      if (items.length > 0) {
        console.log("[COLLECTION] First:", items[0].century, items[0].number);
      }
    } catch (err) {
      console.error("[COLLECTION] Error:", err.message);
      console.error(err.stack);
    }

    return items;
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes"
    },
    templateFormats: ["njk", "html"]
  };
};
