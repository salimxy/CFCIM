import { parseDate } from "./dataset.js";

const CA_THRESHOLD_MDH = 5;
const SCORE_THRESHOLD = 30;

export function escapeHtml(value = "") {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function tendanceFromDynamique(score_dynamique) {
  if (score_dynamique >= 100) return "hausse";
  if (score_dynamique <= 0) return "baisse";
  return "stable";
}

function lastParticipation(participations) {
  if (!participations || participations.length === 0) return null;
  const presentes = participations
    .filter((p) => String(p.Présent).trim().toLowerCase() === "oui")
    .map((p) => ({ ...p, _d: parseDate(p.Date_Événement) }))
    .filter((p) => p._d)
    .sort((a, b) => b._d - a._d);
  if (presentes.length === 0) return null;
  const last = presentes[0];
  return { date: last.Date_Événement, type: last.Type_Événement };
}

export function buildAlerts(segmented) {
  return segmented
    .filter(
      (a) =>
        Number(a.Score_Calculé) < SCORE_THRESHOLD &&
        Number(a.CA_Estimé_MDH ?? 0) > CA_THRESHOLD_MDH,
    )
    .map((a) => ({
      ID_Adherent: a.ID_Adherent,
      Entreprise: a.Entreprise,
      Secteur: a.Secteur,
      Filière_CFCIM: a["Filière_CFCIM"],
      Région: a["Région"],
      Taille: a.Taille,
      CA_Estimé_MDH: a.CA_Estimé_MDH,
      Ancienneté_Années: a["Ancienneté_Années"],
      Statut: a.Statut,
      Email_Optin: a.Email_Optin,
      App_MyCFCIM: a.App_MyCFCIM,
      Score_Calculé: a.Score_Calculé,
      Segment: a.Segment,
      Couleur_Segment: a.Couleur_Segment,
      composantes: {
        events: a.score_events,
        email: a.score_email,
        services: a.score_services,
        digital: a.score_digital,
        dynamique: a.score_dynamique,
      },
      tendance: tendanceFromDynamique(a.score_dynamique),
      services_utilises: a._services ?? [],
      derniere_participation: lastParticipation(a._participations),
      Date_Calcul: a.Date_Calcul,
    }));
}

export function buildAlertEmailHTML(alert, reco) {
  const dp = alert.derniere_participation;
  const dpTxt = dp ? `${escapeHtml(dp.date)} — ${escapeHtml(dp.type)}` : "Aucune";
  const actions = reco?.actions?.length
    ? reco.actions.map((a, i) => `<li><strong>P${i + 1}</strong> — ${escapeHtml(a)}</li>`).join("")
    : "<li>Aucune action recommandée</li>";
  const services = alert.services_utilises.length
    ? alert.services_utilises.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join(" ")
    : '<em>Aucun service utilisé</em>';

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Alerte CFCIM — ${escapeHtml(alert.Entreprise)}</title>
    <style>
      body { font-family: -apple-system, "Segoe UI", sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #222; }
      .alert { border-left: 4px solid #e30613; background: #fff5f5; padding: 20px; border-radius: 4px; }
      h2 { color: #003366; margin-top: 0; }
      h3 { color: #003366; margin-top: 24px; }
      .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; color: #fff; font-size: 12px; background: ${escapeHtml(alert.Couleur_Segment)}; }
      table.components { border-collapse: collapse; width: 100%; margin: 12px 0; }
      table.components td { padding: 6px 10px; border-bottom: 1px solid #eee; }
      table.components td.lbl { color: #555; }
      table.components td.val { text-align: right; font-weight: 600; }
      .chip { display: inline-block; background: #eaf1f8; color: #003366; padding: 3px 10px; margin: 2px; border-radius: 12px; font-size: 12px; }
      .actions li { margin: 8px 0; }
      .email-approche { background: #f4f7fb; border: 1px solid #d7e2ee; padding: 12px; border-radius: 4px; white-space: pre-wrap; font-family: Georgia, serif; }
      .diag { color: #555; font-style: italic; }
    </style>
  </head>
  <body>
    <div class="alert">
      <h2>Alerte engagement — ${escapeHtml(alert.Entreprise)}</h2>
      <p>
        <span class="badge">${escapeHtml(alert.Segment)}</span>
        <strong>Score : ${escapeHtml(alert.Score_Calculé)}/100</strong>
        (tendance : ${escapeHtml(alert.tendance)})
      </p>
      <p>
        <strong>Secteur :</strong> ${escapeHtml(alert.Secteur)} — <strong>Filière :</strong> ${escapeHtml(alert["Filière_CFCIM"])}<br />
        <strong>Région :</strong> ${escapeHtml(alert["Région"])} — <strong>Taille :</strong> ${escapeHtml(alert.Taille)}<br />
        <strong>CA estimé :</strong> ${escapeHtml(alert.CA_Estimé_MDH)} MDH —
        <strong>Ancienneté :</strong> ${escapeHtml(alert["Ancienneté_Années"])} ans —
        <strong>Statut :</strong> ${escapeHtml(alert.Statut)}
      </p>

      <h3>Composantes du score</h3>
      <table class="components">
        <tr><td class="lbl">Événements (30 %)</td><td class="val">${escapeHtml(alert.composantes.events)}/100</td></tr>
        <tr><td class="lbl">Email (25 %)</td><td class="val">${escapeHtml(alert.composantes.email)}/100</td></tr>
        <tr><td class="lbl">Services (20 %)</td><td class="val">${escapeHtml(alert.composantes.services)}/100</td></tr>
        <tr><td class="lbl">Digital (15 %)</td><td class="val">${escapeHtml(alert.composantes.digital)}/100</td></tr>
        <tr><td class="lbl">Dynamique (10 %)</td><td class="val">${escapeHtml(alert.composantes.dynamique)}/100</td></tr>
      </table>

      <h3>Services utilisés</h3>
      <p>${services}</p>

      <h3>Dernière participation événement</h3>
      <p>${dpTxt}</p>

      <h3>Diagnostic IA</h3>
      <p class="diag">${escapeHtml(reco?.diagnostic ?? "Non disponible")}</p>

      <h3>Actions recommandées</h3>
      <ul class="actions">${actions}</ul>

      <h3>Email d'approche pour le chargé d'affaires</h3>
      <div class="email-approche">${escapeHtml(reco?.email_approche ?? "Non disponible")}</div>
    </div>
  </body>
</html>`;
}
