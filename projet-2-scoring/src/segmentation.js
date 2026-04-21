import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, "..", "data", "scores.json");
const OUTPUT = path.join(__dirname, "..", "data", "segments.json");

const SEGMENTS = [
  { name: "Champion", min: 80 },
  { name: "Engagé", min: 60 },
  { name: "Tiède", min: 40 },
  { name: "À risque", min: 20 },
  { name: "Dormant", min: 0 },
];

export function segmentOf(score) {
  return SEGMENTS.find((s) => score >= s.min).name;
}

export async function segmentAll() {
  const scored = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  const segmented = scored.map((m) => ({ ...m, segment: segmentOf(m.score) }));
  await fs.writeFile(OUTPUT, JSON.stringify(segmented, null, 2));
  const counts = segmented.reduce((acc, m) => {
    acc[m.segment] = (acc[m.segment] ?? 0) + 1;
    return acc;
  }, {});
  console.log("[segmentation]", counts);
  return segmented;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  segmentAll();
}
