import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getClaudeClient } from "../../shared/claude-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, "..", "data", "matches.json");
const OUTPUT = path.join(__dirname, "..", "data", "emails.json");

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const SYSTEM = `Tu es chargé de relation membres à la CFCIM. Rédige un email court (max 120 mots) et chaleureux pour inviter un membre à un événement pertinent. Ton : professionnel, chaleureux, français. Signature : "L'équipe CFCIM".
Retourne JSON strict : { "objet": string, "corps_html": string }`;

export async function personalize() {
  const matches = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  const client = getClaudeClient();
  const emails = [];

  for (const m of matches.slice(0, 200)) {
    try {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 600,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `Membre: ${m.memberName} (filière ${m.memberFiliere}, région ${m.memberRegion}).\nÉvénement: ${m.eventTitle} le ${m.eventDate}.`,
          },
        ],
      });
      try {
        const parsed = JSON.parse(res.content[0].text);
        // N'extraire que les champs attendus — pas de spread pour éviter l'écrasement
        emails.push({
          memberId: m.memberId,
          eventId: m.eventId,
          to: m.memberContact,
          objet: parsed.objet,
          corps_html: parsed.corps_html,
        });
      } catch {
        emails.push({ memberId: m.memberId, eventId: m.eventId, error: "parse" });
      }
    } catch (err) {
      console.error(`[personalize] ${m.memberId}×${m.eventId}: ${err.message}`);
      emails.push({ memberId: m.memberId, eventId: m.eventId, error: "api" });
    }
  }

  await fs.writeFile(OUTPUT, JSON.stringify(emails, null, 2));
  console.log(`[personalize] ${emails.length} emails générés`);
  return emails;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  personalize().catch(console.error);
}
