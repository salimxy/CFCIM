import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDataset, parseDate } from "./dataset.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATASET = path.join(__dirname, "..", "data", "CFCIM_Dataset_PowerBI.xlsx");
const DEFAULT_WEIGHTS = path.join(__dirname, "..", "config", "scoring-weights.json");

const TOTAL_SERVICES_CFCIM = 11;
const REQUIRED_WEIGHTS = ["events", "email", "services", "digital", "dynamique"];

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// PRNG déterministe seedé par ID — reproductible en mode démo
function seededRandom(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

async function loadWeights(weightsPath) {
  const raw = JSON.parse(await fs.readFile(weightsPath, "utf-8"));
  for (const key of REQUIRED_WEIGHTS) {
    if (typeof raw[key] !== "number") {
      throw new Error(`Pondération manquante : ${key}`);
    }
  }
  const sum = REQUIRED_WEIGHTS.reduce((acc, k) => acc + raw[k], 0);
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(`Les pondérations doivent sommer à 1.0 (actuel : ${sum})`);
  }
  return raw;
}

function buildParticipationsIndex(participations, now) {
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const byAdherent = new Map();
  const allByAdherent = new Map();

  for (const p of participations) {
    const id = p.ID_Adherent;
    if (!allByAdherent.has(id)) allByAdherent.set(id, []);
    allByAdherent.get(id).push(p);

    if (String(p.Présent).trim().toLowerCase() !== "oui") continue;
    const date = parseDate(p.Date_Événement);
    if (!date || date < twelveMonthsAgo || date > now) continue;

    if (!byAdherent.has(id)) byAdherent.set(id, []);
    byAdherent.get(id).push(p);
  }
  return { recentByAdherent: byAdherent, allByAdherent };
}

function buildServicesIndex(services) {
  const byAdherent = new Map();
  for (const s of services) {
    const id = s.ID_Adherent;
    if (!byAdherent.has(id)) byAdherent.set(id, new Set());
    byAdherent.get(id).add(s.Service);
  }
  return byAdherent;
}

function medianByFiliere(adherents, recentByAdherent) {
  const counts = new Map();
  for (const a of adherents) {
    const filiere = a["Filière_CFCIM"];
    const nb = recentByAdherent.get(a.ID_Adherent)?.length ?? 0;
    if (!counts.has(filiere)) counts.set(filiere, []);
    counts.get(filiere).push(nb);
  }
  const result = new Map();
  for (const [filiere, values] of counts) {
    result.set(filiere, median(values));
  }
  return result;
}

function scoreEvents(nbParticipations, medianeFiliere) {
  if (nbParticipations === 0) return 0;
  if (medianeFiliere === 0) return 100;
  return Math.min(100, (nbParticipations / medianeFiliere) * 100);
}

function scoreEmail(adherent, rng) {
  if (!adherent.Email_Optin || String(adherent.Email_Optin).trim().toLowerCase() !== "oui") {
    return 0;
  }
  const base = (Number(adherent.Score_Engagement ?? 0) / 100) * 0.4;
  const noise = (rng() * 0.1) - 0.05;
  const taux = clamp(base + noise, 0, 1);
  return Math.min(100, taux * 100);
}

function scoreServices(nbDistinctServices) {
  return Math.min(100, (nbDistinctServices / TOTAL_SERVICES_CFCIM) * 100);
}

function scoreDigital(adherent) {
  const app = String(adherent.App_MyCFCIM ?? "").trim().toLowerCase() === "oui" ? 60 : 0;
  const email = String(adherent.Email_Optin ?? "").trim().toLowerCase() === "oui" ? 40 : 0;
  return Math.min(100, app + email);
}

function scoreDynamique(newScore, ancienScore) {
  if (ancienScore == null) return 50;
  if (newScore > ancienScore + 5) return 100;
  if (newScore < ancienScore - 5) return 0;
  return 50;
}

export async function computeScores({
  datasetPath = DEFAULT_DATASET,
  weightsPath = DEFAULT_WEIGHTS,
  now = new Date(),
} = {}) {
  const weights = await loadWeights(weightsPath);
  const { adherents, participations, services } = loadDataset(datasetPath);

  const { recentByAdherent, allByAdherent } = buildParticipationsIndex(participations, now);
  const servicesIndex = buildServicesIndex(services);
  const medianes = medianByFiliere(adherents, recentByAdherent);

  const dateCalcul = now.toISOString().slice(0, 10);

  return adherents.map((a) => {
    const id = a.ID_Adherent;
    const nbParticipations = recentByAdherent.get(id)?.length ?? 0;
    const medianeFiliere = medianes.get(a["Filière_CFCIM"]) ?? 0;
    const nbServicesDistincts = servicesIndex.get(id)?.size ?? 0;
    const rng = seededRandom(id);

    const s_events = scoreEvents(nbParticipations, medianeFiliere);
    const s_email = scoreEmail(a, rng);
    const s_services = scoreServices(nbServicesDistincts);
    const s_digital = scoreDigital(a);

    const weighted =
      s_events * weights.events +
      s_email * weights.email +
      s_services * weights.services +
      s_digital * weights.digital;

    // Le score dynamique compare au Score_Engagement précédent ; on l'intègre en dernier.
    // Pour comparer un score composite homogène, on ajoute sa pondération après coup.
    const ancien = Number(a.Score_Engagement ?? 0);
    const scoreSansDynamique = weighted / (1 - weights.dynamique);
    const s_dynamique = scoreDynamique(scoreSansDynamique, ancien);
    const total = weighted + s_dynamique * weights.dynamique;

    return {
      ...a,
      score_events: Math.round(s_events),
      score_email: Math.round(s_email),
      score_services: Math.round(s_services),
      score_digital: Math.round(s_digital),
      score_dynamique: Math.round(s_dynamique),
      Score_Calculé: Math.round(clamp(total, 0, 100)),
      Nb_Participations_12m: nbParticipations,
      Nb_Services_Distincts: nbServicesDistincts,
      Date_Calcul: dateCalcul,
      _participations: allByAdherent.get(id) ?? [],
      _services: [...(servicesIndex.get(id) ?? [])],
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  computeScores()
    .then((rows) => console.log(`[scoring] ${rows.length} adhérents scorés`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
