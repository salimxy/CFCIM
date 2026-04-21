import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getClaudeClient } from "../../shared/claude-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, "..", "data", "articles-raw.json");
const OUTPUT = path.join(__dirname, "..", "data", "articles-classified.json");

const SYSTEM = `Tu es un analyste de veille économique pour la CFCIM (Chambre Française de Commerce et d'Industrie du Maroc).
Pour chaque article fourni, réponds en JSON strict :
{ "theme": string, "secteur": string, "pays": "Maroc"|"France"|"International", "pertinence": 1-5, "resume": string (2 phrases max) }`;

export async function classify(articles) {
  const client = getClaudeClient();
  const classified = [];

  for (const article of articles) {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Titre: ${article.title}\nExtrait: ${article.snippet}\nSource: ${article.source}`,
        },
      ],
    });

    try {
      const parsed = JSON.parse(res.content[0].text);
      classified.push({ ...article, ...parsed });
    } catch {
      classified.push({ ...article, pertinence: 0, error: "parse" });
    }
  }

  await fs.writeFile(OUTPUT, JSON.stringify(classified, null, 2));
  console.log(`[classify] ${classified.length} articles classés`);
  return classified;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  classify(raw);
}
