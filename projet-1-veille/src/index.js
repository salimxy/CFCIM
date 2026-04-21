import { collect } from "./collect.js";
import { classify } from "./classify.js";
import { generateEmail } from "./generate-email.js";
import { store } from "./store.js";

async function main() {
  const raw = await collect();
  const classified = await classify(raw);
  await store(classified);
  await generateEmail(classified);
  console.log("[veille] pipeline terminé");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
