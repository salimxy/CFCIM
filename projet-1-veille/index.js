import "dotenv/config";
import { collect } from "./src/collect.js";
import { classify } from "./src/classify.js";
import { store } from "./src/store.js";
import { generateEmail } from "./src/generate-email.js";

const DEMO_FLAG = process.argv.includes("--demo");

async function main() {
  console.log("=== CFCIM Veille Économique ===");
  console.log(`Mode : ${DEMO_FLAG ? "DÉMO (articles fictifs)" : "PRODUCTION"}`);
  console.log(`Démarrage : ${new Date().toLocaleString("fr-FR")}\n`);

  let articles;

  if (DEMO_FLAG) {
    // Mode démo : importe les articles fictifs depuis demo/generate-demo.js
    console.log("[main] Chargement des articles de démo...");
    const { DEMO_ARTICLES } = await import("./demo/generate-demo.js");
    articles = DEMO_ARTICLES;
    console.log(`[main] ${articles.length} articles de démo chargés\n`);
  } else {
    // Mode production
    console.log("[main] Étape 1/3 — Collecte RSS...");
    const rawArticles = await collect();

    console.log("\n[main] Étape 2/3 — Classification par Claude...");
    articles = await classify(rawArticles);
  }

  console.log("\n[main] Stockage...");
  await store(articles);

  console.log("\n[main] Génération de l'email...");
  const html = await generateEmail(articles);

  console.log(`\n✅ Pipeline terminé : ${articles.length} articles → email généré`);
  console.log("   Fichier : data/email-veille.html");
  return html;
}

main().catch((err) => {
  console.error("\n❌ Erreur :", err.message);
  process.exit(1);
});
