import { match } from "./matching.js";
import { personalize } from "./personalize.js";

async function main() {
  await match();
  await personalize();
  console.log("[matching] pipeline terminé");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
