import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(__dirname, "..", "templates", "email-veille.html");
const INPUT = path.join(__dirname, "..", "data", "articles-classified.json");
const OUTPUT = path.join(__dirname, "..", "data", "email-veille.html");

export async function generateEmail(articles) {
  const template = await fs.readFile(TEMPLATE, "utf-8");
  const topArticles = articles
    .filter((a) => a.pertinence >= 3)
    .sort((a, b) => b.pertinence - a.pertinence)
    .slice(0, 10);

  const itemsHtml = topArticles
    .map(
      (a) => `
    <div class="article">
      <div class="meta">${a.secteur ?? "—"} · ${a.pays ?? "—"} · ${"★".repeat(a.pertinence)}</div>
      <h3><a href="${a.link}">${a.title}</a></h3>
      <p>${a.resume ?? a.snippet ?? ""}</p>
      <small>${a.source}</small>
    </div>`
    )
    .join("\n");

  const html = template
    .replace("{{DATE}}", new Date().toLocaleDateString("fr-FR"))
    .replace("{{ARTICLES}}", itemsHtml)
    .replace("{{COUNT}}", String(topArticles.length));

  await fs.writeFile(OUTPUT, html);
  console.log(`[email] généré → ${OUTPUT}`);
  return html;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const articles = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  generateEmail(articles);
}
