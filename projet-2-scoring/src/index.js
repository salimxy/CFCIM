import { computeScores } from "./scoring.js";
import { segmentAll } from "./segmentation.js";
import { generateAlerts } from "./alerts.js";
import { recommend } from "./recommend.js";

async function main() {
  await computeScores();
  await segmentAll();
  await generateAlerts();
  await recommend();
  console.log("[scoring] pipeline terminé");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
