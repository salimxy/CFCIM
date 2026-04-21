import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendRows } from "../../shared/sheets-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, "..", "data", "articles-classified.json");
const SHEET_ID = process.env.VEILLE_SHEET_ID;
const LOCAL_OUT = path.join(__dirname, "..", "data", "archive.json");

export async function store(articles) {
  if (SHEET_ID) {
    const rows = articles.map((a) => [
      new Date().toISOString(),
      a.source,
      a.theme,
      a.secteur,
      a.pays,
      a.pertinence,
      a.title,
      a.link,
    ]);
    await appendRows(SHEET_ID, "Veille!A:H", rows);
    console.log(`[store] ${rows.length} lignes → Google Sheets`);
    return;
  }

  let archive = [];
  try {
    archive = JSON.parse(await fs.readFile(LOCAL_OUT, "utf-8"));
  } catch {}
  archive.push({ date: new Date().toISOString(), articles });
  await fs.writeFile(LOCAL_OUT, JSON.stringify(archive, null, 2));
  console.log(`[store] archive locale → ${LOCAL_OUT}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const articles = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  store(articles);
}
