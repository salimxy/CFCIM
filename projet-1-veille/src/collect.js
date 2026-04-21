import Parser from "rss-parser";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCES_PATH = path.join(__dirname, "..", "config", "sources.json");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "articles-raw.json");

export async function collect() {
  const sources = JSON.parse(await fs.readFile(SOURCES_PATH, "utf-8"));
  const parser = new Parser();
  const articles = [];

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url);
      for (const item of feed.items) {
        articles.push({
          source: source.name,
          category: source.category,
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          snippet: item.contentSnippet ?? item.content ?? "",
        });
      }
    } catch (err) {
      console.error(`[collect] ${source.name}: ${err.message}`);
    }
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(articles, null, 2));
  console.log(`[collect] ${articles.length} articles → ${OUTPUT_PATH}`);
  return articles;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  collect();
}
