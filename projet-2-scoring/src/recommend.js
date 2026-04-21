import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getClaudeClient } from "../../shared/claude-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, "..", "data", "alerts.json");
const OUTPUT = path.join(__dirname, "..", "data", "recommendations.json");

const SYSTEM = `Tu es expert CRM CFCIM. Pour un membre en difficulté d'engagement, propose 3 actions concrètes et priorisées.
Réponds en JSON strict : { "actions": [{ "titre": string, "canal": "email"|"téléphone"|"événement"|"visite", "priorite": 1-3, "justification": string }] }`;

export async function recommend() {
  const alerts = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  const client = getClaudeClient();
  const recommendations = [];

  for (const alert of alerts) {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Membre: ${alert.name}\nSegment: ${alert.segment}\nScore: ${alert.score}/100`,
        },
      ],
    });
    try {
      const parsed = JSON.parse(res.content[0].text);
      recommendations.push({ memberId: alert.memberId, ...parsed });
    } catch {
      recommendations.push({ memberId: alert.memberId, error: "parse" });
    }
  }

  await fs.writeFile(OUTPUT, JSON.stringify(recommendations, null, 2));
  console.log(`[recommend] ${recommendations.length} recommandations`);
  return recommendations;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  recommend();
}
