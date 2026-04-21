import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMembers } from "../../shared/data-loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEIGHTS_PATH = path.join(__dirname, "..", "config", "scoring-weights.json");
const DATASET = path.join(__dirname, "..", "data", "CFCIM_Dataset_PowerBI.xlsx");
const OUTPUT = path.join(__dirname, "..", "data", "scores.json");

const REQUIRED_WEIGHT_KEYS = ["cotisation", "events", "emails", "anciennete", "appels"];

function normalize(value, max) {
  if (max === 0) return 0;
  return Math.min(1, value / max);
}

export async function computeScores() {
  const weights = JSON.parse(await fs.readFile(WEIGHTS_PATH, "utf-8"));

  // Validation des pondérations : présence + somme ≈ 1
  for (const key of REQUIRED_WEIGHT_KEYS) {
    if (typeof weights[key] !== "number") throw new Error(`Pondération manquante : ${key}`);
  }
  const sum = REQUIRED_WEIGHT_KEYS.reduce((acc, k) => acc + weights[k], 0);
  if (Math.abs(sum - 1) > 1e-6) throw new Error(`Les pondérations doivent sommer à 1.0 (actuel : ${sum})`);

  const members = await loadMembers(DATASET);

  const maxEvents = Math.max(...members.map((m) => m.events_attended ?? 0), 1);
  const maxOpens = Math.max(...members.map((m) => m.email_opens ?? 0), 1);
  const maxAnciennete = Math.max(...members.map((m) => m.anciennete_years ?? 0), 1);

  const scored = members.map((m) => {
    // Ne pas accorder de crédit de récence à une valeur nulle ou invalide
    const contactJours = Number(m.dernier_contact_jours);
    const hasRecentContact =
      Number.isFinite(contactJours) && contactJours >= 0 && contactJours <= 90;

    const score =
      weights.cotisation * (m.cotisation_a_jour ? 1 : 0) +
      weights.events * normalize(m.events_attended ?? 0, maxEvents) +
      weights.emails * normalize(m.email_opens ?? 0, maxOpens) +
      weights.anciennete * normalize(m.anciennete_years ?? 0, maxAnciennete) +
      weights.appels * (hasRecentContact ? 1 : 0);

    return { ...m, score: Math.round(score * 100) };
  });

  await fs.writeFile(OUTPUT, JSON.stringify(scored, null, 2));
  console.log(`[scoring] ${scored.length} membres scorés`);
  return scored;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  computeScores().catch(console.error);
}
