import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, "..", "data", "articles-raw.json");
const OUTPUT = path.join(__dirname, "..", "data", "articles-classified.json");

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const SYSTEM_PROMPT = `Tu es analyste économique senior à la CFCIM.
Pour chaque article, retourne un JSON :
{
  "filiere_cfcim": "Industrie & Infrastructures | Agrotech | Tech & Services | Art de vivre & Santé | Cleantech | Transversal",
  "pertinence": 1-5 (pertinence pour les entreprises françaises au Maroc),
  "resume": "résumé en 2 lignes max",
  "implications": "implications pour les adhérents CFCIM en 1 ligne",
  "coupe_du_monde_2030": true ou false,
  "mots_cles": ["mot1", "mot2", "mot3"]
}
Réponds UNIQUEMENT avec le JSON, sans texte additionnel.`;

// Pause configurable entre les appels API pour respecter le rate limiting
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Envoie un batch de 5 articles en un seul appel Claude et retourne un tableau de résultats
async function classifyBatch(client, batch) {
  const articlesText = batch
    .map(
      (a, i) =>
        `Article ${i + 1} :\nTitre: ${a.titre}\nSource: ${a.source}\nExtrait: ${a.contenu.slice(0, 400)}`
    )
    .join("\n\n---\n\n");

  const prompt = `Classifie les ${batch.length} articles suivants. Réponds avec un tableau JSON de ${batch.length} objets dans le même ordre.\n\n${articlesText}`;

  try {
    const res = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = res.content[0].text.trim();
    // Extrait le tableau JSON même si Claude ajoute du texte autour
    const match = rawText.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Réponse non JSON");
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) throw new Error("Réponse n'est pas un tableau");
    return parsed;
  } catch (err) {
    console.error(`[classify] Erreur batch : ${err.message}`);
    // Fallback : retourne des objets neutres pour chaque article du batch
    return batch.map(() => ({
      filiere_cfcim: "Transversal",
      pertinence: 0,
      resume: "",
      implications: "",
      coupe_du_monde_2030: false,
      mots_cles: [],
      error: "classify",
    }));
  }
}

export async function classify(articles) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquant dans .env");
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const classified = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    console.log(
      `[classify] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(articles.length / BATCH_SIZE)} (${batch.length} articles)`
    );

    const results = await classifyBatch(client, batch);

    for (let j = 0; j < batch.length; j++) {
      const classification = results[j] ?? { pertinence: 0, error: "missing" };
      const pertinence = Math.max(0, Math.min(5, Number(classification.pertinence) || 0));
      classified.push({
        ...batch[j],
        filiere_cfcim: classification.filiere_cfcim ?? "Transversal",
        pertinence,
        resume: classification.resume ?? "",
        implications: classification.implications ?? "",
        coupe_du_monde_2030: Boolean(classification.coupe_du_monde_2030),
        mots_cles: Array.isArray(classification.mots_cles) ? classification.mots_cles : [],
      });
    }

    // Pause 1s entre les batches pour respecter le rate limiting
    if (i + BATCH_SIZE < articles.length) await pause(1000);
  }

  // Filtre les articles avec pertinence >= 3
  const pertinents = classified.filter((a) => a.pertinence >= 3);
  console.log(
    `[classify] ${classified.length} classifiés → ${pertinents.length} pertinents (pertinence ≥ 3)`
  );

  await fs.writeFile(OUTPUT, JSON.stringify(pertinents, null, 2));
  return pertinents;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  classify(raw).catch(console.error);
}
