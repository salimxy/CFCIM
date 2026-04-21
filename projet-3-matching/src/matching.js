import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMembers } from "../../shared/data-loader.js";
import { loadEvents } from "./events-loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_PATH = path.join(__dirname, "..", "config", "matching-rules.json");
const DATASET = path.join(__dirname, "..", "data", "CFCIM_Dataset_PowerBI.xlsx");
const OUTPUT = path.join(__dirname, "..", "data", "matches.json");

function scoreMatch(member, event, rules) {
  let score = 0;

  if (event.filieres?.includes(member.filiere)) score += rules.exact_filiere;
  else if (rules.filieres_connexes?.[member.filiere]?.some((f) => event.filieres?.includes(f))) {
    score += rules.filiere_connexe;
  }

  if (event.regions?.includes(member.region)) score += rules.exact_region;
  else if (rules.regions_limitrophes?.[member.region]?.some((r) => event.regions?.includes(r))) {
    score += rules.region_limitrophe;
  }

  if (event.tailles_cibles?.includes(member.taille)) score += rules.taille_match;

  return score;
}

export async function match() {
  const rules = JSON.parse(await fs.readFile(RULES_PATH, "utf-8"));
  const members = await loadMembers(DATASET);
  const events = await loadEvents();

  const matches = [];
  for (const event of events) {
    for (const member of members) {
      const score = scoreMatch(member, event, rules);
      if (score >= rules.seuil_minimum) {
        matches.push({
          eventId: event.id,
          eventTitle: event.titre,
          eventDate: event.date,
          memberId: member.id,
          memberName: member.raison_sociale,
          memberContact: member.contact_email,
          memberFiliere: member.filiere,
          memberRegion: member.region,
          score,
        });
      }
    }
  }

  matches.sort((a, b) => b.score - a.score);
  await fs.writeFile(OUTPUT, JSON.stringify(matches, null, 2));
  console.log(`[matching] ${matches.length} matches sur ${events.length} événements`);
  return matches;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  match();
}
