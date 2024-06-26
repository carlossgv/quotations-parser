const cheerio = require("cheerio");
const fs = require("fs");

// Check if the file path is provided as an argument
if (process.argv.length !== 4) {
  console.error("Usage: node script.js <input.html> <output.md>");
  process.exit(1);
}

// Get the input HTML file path and output Markdown file path from command-line arguments
const htmlFilePath = process.argv[2];
const mdFilePath = process.argv[3];

// Read HTML content from the file
const html = fs.readFileSync(htmlFilePath, "utf-8");

const $ = cheerio.load(html);
let contentArray = [];

// Process each line of HTML
$("body")
  .contents()
  .each((_index, element) => {
    parseElement(element);
  });

function parseElement(element) {
  if (element.children) {
    element.children.forEach((child) => {
      parseElement(child);
    });
  }

  if (element.type === "tag") {
    // Handle tag nodes
    if ($(element).hasClass("sectionHeading")) {
      const sectionHeading = $(element).text().trim();
      contentArray.push({
        type: "sectionHeading",
        title: sectionHeading,
        content: [],
      });
    } else {
      // get last element in contentArray
      const lastSectionHeading = contentArray[contentArray.length - 1];
      if ($(element).hasClass("noteHeading")) {
        let title = $(element).text().trim();
        if (title.startsWith("Bookmark")) {
          return;
        }

        // get only the text after Page
        const page = title.split("-")[1].trim();

        lastSectionHeading.content.push({
          type: "noteHeading",
          title: page,
        });
      }

      if ($(element).hasClass("noteText")) {
        const lastNoteHeading =
          lastSectionHeading.content[lastSectionHeading.content.length - 1];
        lastNoteHeading.content = $(element).text().trim();
      }
    }
  }
}

// filter contentArray, remove the ones with empty content
contentArray = contentArray.filter((section) => {
  section.content = section.content.filter((note) => {
    return note.content;
  });
  return section.content.length;
});

let markdownContent = "";
contentArray.forEach((section) => {
  markdownContent += `## ${section.title}\n\n`;
  section.content.forEach((note) => {
    markdownContent += `**${note.title}**\n`;
    markdownContent += `> ${note.content}\n\n`;
  });
});

// Write Markdown content to the output file
fs.writeFileSync(mdFilePath, markdownContent);

console.log(`Markdown file '${mdFilePath}' has been created successfully.`);
