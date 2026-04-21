import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const ARCHIVE_PATH = path.join(DATA_DIR, "archive.json");

export async function store(articles) {
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Sauvegarde du fichier quotidien
  const dateStr = new Date().toISOString().slice(0, 10);
  const dailyPath = path.join(DATA_DIR, `veille-${dateStr}.json`);
  await fs.writeFile(dailyPath, JSON.stringify(articles, null, 2));
  console.log(`[store] ${articles.length} articles → ${dailyPath}`);

  // Mise à jour de l'archive historique
  let archive = [];
  try {
    archive = JSON.parse(await fs.readFile(ARCHIVE_PATH, "utf-8"));
  } catch (err) {
    // Fichier inexistant : on repart de zéro — toute autre erreur est remontée
    if (err.code !== "ENOENT") throw err;
  }

  archive.push({ date: dateStr, count: articles.length, articles });
  await fs.writeFile(ARCHIVE_PATH, JSON.stringify(archive, null, 2));
  console.log(`[store] Archive mise à jour (${archive.length} jours)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const INPUT = path.join(DATA_DIR, "articles-classified.json");
  const articles = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  store(articles).catch(console.error);
}
