import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVENTS = path.join(__dirname, "..", "data", "evenements-a-venir.json");

export async function loadEvents() {
  const raw = JSON.parse(await fs.readFile(EVENTS, "utf-8"));
  const now = Date.now();
  return raw.filter((e) => new Date(e.date).getTime() >= now);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const events = await loadEvents();
  console.log(events);
}
