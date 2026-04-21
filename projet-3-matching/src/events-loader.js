import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVENTS = path.join(__dirname, "..", "data", "evenements-a-venir.json");

export async function loadEvents() {
  const raw = JSON.parse(await fs.readFile(EVENTS, "utf-8"));
  // Compare par jour calendaire (heure locale) pour éviter le problème UTC avec YYYY-MM-DD
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return raw.filter((e) => {
    const eventDate = new Date(e.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() >= today.getTime();
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const events = await loadEvents();
  console.log(events);
}
