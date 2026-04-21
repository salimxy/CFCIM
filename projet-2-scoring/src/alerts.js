import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sendEmail } from "../../shared/email-sender.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, "..", "data", "segments.json");
const OUTPUT = path.join(__dirname, "..", "data", "alerts.json");

const CRITICAL_SEGMENTS = new Set(["À risque", "Dormant"]);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function generateAlerts() {
  const members = JSON.parse(await fs.readFile(INPUT, "utf-8"));

  // Les destinataires SMTP sont lus en mémoire mais pas persistés dans le JSON (PII)
  const alertsWithRecipients = members
    .filter((m) => CRITICAL_SEGMENTS.has(m.segment))
    .map((m) => ({
      memberId: m.id,
      name: m.raison_sociale,
      segment: m.segment,
      score: m.score,
      message: `${m.raison_sociale} est passé en segment « ${m.segment} » (score ${m.score}/100).`,
      _notifyTo: m.account_manager?.email ?? null,
    }));

  // Persiste sans les adresses email des chargés de compte
  const alertsToStore = alertsWithRecipients.map(({ _notifyTo: _, ...a }) => a);
  await fs.writeFile(OUTPUT, JSON.stringify(alertsToStore, null, 2));
  console.log(`[alerts] ${alertsToStore.length} alertes`);

  for (const alert of alertsWithRecipients) {
    if (alert._notifyTo && process.env.SMTP_HOST) {
      await sendEmail({
        to: alert._notifyTo,
        subject: `[CFCIM] Alerte engagement — ${alert.name}`,
        html: `<p>${escapeHtml(alert.message)}</p><p>Consulter le dashboard scoring pour actions.</p>`,
      });
    }
  }
  return alertsToStore;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateAlerts().catch(console.error);
}
