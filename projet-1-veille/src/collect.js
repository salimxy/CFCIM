import "dotenv/config";
import Parser from "rss-parser";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCES_PATH = path.join(__dirname, "..", "config", "sources.json");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "articles-raw.json");

// Similarité de Levenshtein normalisée entre deux chaînes (0 = différent, 1 = identique)
function levenshteinSimilarity(a, b) {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return 1;
  const m = al.length;
  const n = bl.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        al[i - 1] === bl[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return 1 - dp[m][n] / Math.max(m, n);
}

// Déduplique un tableau d'articles : supprime les doublons dont la similarité de titre > seuil
function deduplicate(articles, threshold = 0.8) {
  const unique = [];
  for (const article of articles) {
    const isDuplicate = unique.some(
      (u) => levenshteinSimilarity(u.titre, article.titre) >= threshold
    );
    if (!isDuplicate) unique.push(article);
  }
  return unique;
}

export async function collect() {
  const sources = JSON.parse(await fs.readFile(SOURCES_PATH, "utf-8"));
  // Timeout explicite de 10s par source pour éviter les blocages
  const parser = new Parser({ timeout: 10_000 });
  const articles = [];

  // Collecte parallèle : toutes les sources en même temps
  const results = await Promise.allSettled(
    sources.map((source) =>
      parser.parseURL(source.url).then((feed) => ({ source, feed }))
    )
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error(`[collect] Source indisponible : ${result.reason?.message}`);
      continue;
    }
    const { source, feed } = result.value;
    for (const item of feed.items) {
      articles.push({
        titre: item.title ?? "",
        lien: item.link ?? "",
        date: item.pubDate ?? new Date().toISOString(),
        source: source.name,
        categorie: source.category,
        contenu: item.contentSnippet ?? item.content ?? item.summary ?? "",
      });
    }
  }

  const deduplicated = deduplicate(articles);
  console.log(
    `[collect] ${articles.length} articles collectés → ${deduplicated.length} après déduplication`
  );

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(deduplicated, null, 2));
  return deduplicated;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  collect().catch(console.error);
}
