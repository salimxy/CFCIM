import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sendEmail } from "../../shared/email-sender.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, "..", "data", "segments.json");
const OUTPUT = path.join(__dirname, "..", "data", "alerts.json");

const CRITICAL_SEGMENTS = new Set(["À risque", "Dormant"]);

export async function generateAlerts() {
  const members = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  const alerts = members
    .filter((m) => CRITICAL_SEGMENTS.has(m.segment))
    .map((m) => ({
      memberId: m.id,
      name: m.raison_sociale,
      segment: m.segment,
      score: m.score,
      account_manager: m.account_manager,
      message: `${m.raison_sociale} est passé en segment « ${m.segment} » (score ${m.score}/100).`,
    }));

  await fs.writeFile(OUTPUT, JSON.stringify(alerts, null, 2));
  console.log(`[alerts] ${alerts.length} alertes`);

  for (const alert of alerts) {
    if (alert.account_manager?.email && process.env.SMTP_HOST) {
      await sendEmail({
        to: alert.account_manager.email,
        subject: `[CFCIM] Alerte engagement — ${alert.name}`,
        html: `<p>${alert.message}</p><p>Consulter le dashboard scoring pour actions.</p>`,
      });
    }
  }
  return alerts;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateAlerts();
}
