import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import xlsx from "xlsx";

import { computeScores } from "./scoring.js";
import { applySegmentation, computeStats, SEGMENTS } from "./segmentation.js";
import { buildAlerts, buildAlertEmailHTML } from "./alerts.js";
import { recommend } from "./recommend.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const DEMO_DIR = path.join(PROJECT_ROOT, "demo");
const ALERTES_DIR = path.join(DEMO_DIR, "alertes");
const SCORED_XLSX = path.join(DATA_DIR, "CFCIM_Scored.xlsx");
const SCORED_XLSX_DEMO = path.join(DEMO_DIR, "CFCIM_Scored.xlsx");
const STATS_JSON = path.join(DEMO_DIR, "stats-scoring.json");

const EXCEL_COLUMNS = [
  "ID_Adherent", "Entreprise", "Secteur", "Filière_CFCIM", "Région", "Taille",
  "Date_Adhésion", "Ancienneté_Années", "Statut", "CA_Estimé_MDH",
  "Nb_Services_Utilisés", "Email_Optin", "App_MyCFCIM",
  "Score_Engagement", "Score_Calculé",
  "score_events", "score_email", "score_services", "score_digital", "score_dynamique",
  "Nb_Participations_12m", "Nb_Services_Distincts",
  "Segment", "Couleur_Segment", "Date_Calcul",
];

function parseArgs(argv) {
  return { demo: argv.includes("--demo") };
}

function pickExcelColumns(row) {
  const out = {};
  for (const col of EXCEL_COLUMNS) out[col] = row[col] ?? null;
  return out;
}

async function writeScoredExcel(segmented) {
  const cleaned = segmented.map(pickExcelColumns);
  const ws = xlsx.utils.json_to_sheet(cleaned, { header: EXCEL_COLUMNS });
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Adherents_Scores");
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(DEMO_DIR, { recursive: true });
  xlsx.writeFile(wb, SCORED_XLSX);
  xlsx.writeFile(wb, SCORED_XLSX_DEMO);
}

function printStats(stats, alertsSummary) {
  console.log("=== SCORING CFCIM ===");
  console.log(`Total adhérents : ${stats.total}`);
  for (const seg of SEGMENTS) {
    const s = stats.segments[seg.name];
    console.log(`${seg.name} : ${s.nb} (${s.pct}%)`);
  }
  console.log("--- ALERTES ---");
  console.log(`Adhérents à risque avec CA > 5 MDH : ${alertsSummary.count}`);
  console.log(`CA total à risque : ${alertsSummary.ca_total_mdh} MDH`);
}

async function main() {
  const { demo } = parseArgs(process.argv.slice(2));
  if (demo) console.log("[scoring] mode démo activé (sans appel API Claude)");

  const scored = await computeScores();
  const segmented = applySegmentation(scored);
  const stats = computeStats(segmented);

  const alerts = buildAlerts(segmented);
  const ca_total = alerts.reduce((acc, a) => acc + Number(a.CA_Estimé_MDH ?? 0), 0);
  const alertsSummary = {
    count: alerts.length,
    ca_total_mdh: Math.round(ca_total * 10) / 10,
  };

  await fs.mkdir(ALERTES_DIR, { recursive: true });
  // Nettoie les anciens emails pour éviter les orphelins
  for (const f of await fs.readdir(ALERTES_DIR).catch(() => [])) {
    if (f.startsWith("alerte-") && f.endsWith(".html")) {
      await fs.unlink(path.join(ALERTES_DIR, f));
    }
  }

  for (const alert of alerts) {
    const reco = await recommend(alert, { demo });
    const html = buildAlertEmailHTML(alert, reco);
    const file = path.join(ALERTES_DIR, `alerte-${alert.ID_Adherent}.html`);
    await fs.writeFile(file, html, "utf-8");
  }

  await writeScoredExcel(segmented);

  await fs.writeFile(
    STATS_JSON,
    JSON.stringify({ ...stats, alertes: alertsSummary, date: new Date().toISOString() }, null, 2),
  );

  printStats(stats, alertsSummary);
  console.log(`[scoring] Excel enrichi : ${path.relative(PROJECT_ROOT, SCORED_XLSX_DEMO)}`);
  console.log(`[scoring] Stats JSON : ${path.relative(PROJECT_ROOT, STATS_JSON)}`);
  console.log(`[scoring] ${alerts.length} emails d'alerte générés dans ${path.relative(PROJECT_ROOT, ALERTES_DIR)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
