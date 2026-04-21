import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import xlsx from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.join(__dirname, "..");
const DEMO = path.join(PROJECT, "demo");
const OUT = path.join(DEMO, "presentation");
const SCORED_XLSX = path.join(DEMO, "CFCIM_Scored.xlsx");
const STATS_JSON = path.join(DEMO, "stats-scoring.json");

function esc(v = "") {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toCSV(rows, columns) {
  const header = columns.join(",");
  const body = rows
    .map((r) =>
      columns
        .map((c) => {
          const v = r[c] ?? "";
          const s = String(v).replaceAll('"', '""');
          return /[",\n;]/.test(s) ? `"${s}"` : s;
        })
        .join(","),
    )
    .join("\n");
  return header + "\n" + body + "\n";
}

function barSegment(seg, stats, maxNb) {
  const s = stats.segments[seg.name];
  const w = Math.max(2, (s.nb / maxNb) * 100);
  return `
    <div class="bar-row">
      <div class="bar-label">${esc(seg.name)}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${w}%; background:${esc(seg.color)}">
          <span class="bar-value">${s.nb} — ${s.pct}%</span>
        </div>
      </div>
      <div class="bar-ca">${s.ca_total_mdh.toLocaleString("fr-FR")} MDH</div>
    </div>`;
}

function buildDashboard(stats, top10, rows) {
  const SEGMENTS = [
    { name: "Champion", color: "#2E7D32" },
    { name: "Actif engagé", color: "#66BB6A" },
    { name: "Modéré", color: "#FFA726" },
    { name: "À risque", color: "#EF6C00" },
    { name: "Dormant", color: "#C62828" },
  ];
  const maxNb = Math.max(...SEGMENTS.map((s) => stats.segments[s.name].nb), 1);

  const avgScore =
    Math.round(
      (rows.reduce((a, r) => a + Number(r.Score_Calculé || 0), 0) / rows.length) * 10,
    ) / 10;
  const pctRisque =
    Math.round(
      ((stats.segments["À risque"].nb + stats.segments["Dormant"].nb) / stats.total) * 100,
    );

  const topRows = top10
    .map(
      (a, i) => `
      <tr>
        <td class="rk">${i + 1}</td>
        <td><strong>${esc(a.Entreprise)}</strong><br /><span class="muted">${esc(a.ID_Adherent)}</span></td>
        <td>${esc(a.Secteur)}</td>
        <td>${esc(a["Filière_CFCIM"])}</td>
        <td class="num">${esc(a.CA_Estimé_MDH)}</td>
        <td class="num"><span class="score-badge" style="background:${esc(a.Couleur_Segment)}">${esc(a.Score_Calculé)}</span></td>
        <td class="num">${esc(a.score_events)}</td>
        <td class="num">${esc(a.score_email)}</td>
        <td class="num">${esc(a.score_services)}</td>
        <td class="num">${esc(a.score_digital)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>CFCIM — Dashboard Scoring d'Engagement</title>
<style>
  :root { --cfcim-red: #e30613; --cfcim-blue: #003366; --bg: #f5f7fa; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", sans-serif; background: var(--bg); margin: 0; color: #222; }
  .page { max-width: 1100px; margin: 0 auto; padding: 32px; }
  header { background: var(--cfcim-blue); color: white; margin: -32px -32px 24px; padding: 28px 32px; border-bottom: 4px solid var(--cfcim-red); }
  header h1 { margin: 0; font-size: 24px; }
  header .sub { opacity: 0.85; margin-top: 4px; font-size: 14px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .kpi { background: white; padding: 18px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .kpi-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi-value { font-size: 28px; font-weight: 700; color: var(--cfcim-blue); margin-top: 4px; }
  .kpi-sub { font-size: 12px; color: #888; margin-top: 4px; }
  .card { background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); margin-bottom: 24px; }
  .card h2 { color: var(--cfcim-blue); margin: 0 0 18px; font-size: 18px; border-bottom: 2px solid #eef; padding-bottom: 10px; }
  .bar-row { display: grid; grid-template-columns: 140px 1fr 140px; gap: 12px; align-items: center; margin: 10px 0; }
  .bar-label { font-weight: 600; font-size: 14px; }
  .bar-track { background: #eef; border-radius: 4px; height: 28px; overflow: hidden; position: relative; }
  .bar-fill { height: 100%; display: flex; align-items: center; padding: 0 10px; color: white; border-radius: 4px; transition: width 0.5s; }
  .bar-value { font-size: 13px; font-weight: 600; white-space: nowrap; }
  .bar-ca { text-align: right; font-size: 13px; color: #555; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f4f7fb; color: var(--cfcim-blue); text-align: left; padding: 10px; border-bottom: 2px solid #e0e6ef; font-weight: 600; }
  td { padding: 10px; border-bottom: 1px solid #f0f2f6; }
  td.num, th.num { text-align: right; }
  td.rk { color: #999; font-weight: 700; }
  .score-badge { color: white; padding: 3px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; }
  .muted { color: #888; font-size: 11px; }
  .legend { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 16px; font-size: 12px; color: #555; }
  .legend .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
  footer { margin-top: 30px; color: #888; font-size: 12px; text-align: center; }
  .alert-box { background: #fff5f5; border-left: 4px solid var(--cfcim-red); padding: 14px 18px; border-radius: 4px; }
</style>
</head>
<body>
<div class="page">
  <header>
    <h1>CFCIM — Scoring d'engagement des adhérents</h1>
    <div class="sub">Dashboard automatique • Calcul du ${esc(stats.date?.slice(0, 10) ?? "—")} • 500 adhérents analysés</div>
  </header>

  <div class="kpis">
    <div class="kpi">
      <div class="kpi-label">Total adhérents</div>
      <div class="kpi-value">${stats.total}</div>
      <div class="kpi-sub">base CFCIM complète</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Score moyen</div>
      <div class="kpi-value">${avgScore}/100</div>
      <div class="kpi-sub">pondération multicritère</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">% en risque</div>
      <div class="kpi-value" style="color: var(--cfcim-red)">${pctRisque}%</div>
      <div class="kpi-sub">À risque + Dormant</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Alertes prioritaires</div>
      <div class="kpi-value" style="color: var(--cfcim-red)">${stats.alertes.count}</div>
      <div class="kpi-sub">Score&lt;30 ∧ CA&gt;5 MDH</div>
    </div>
  </div>

  <div class="card alert-box">
    <strong>CA en jeu :</strong> ${stats.alertes.ca_total_mdh.toLocaleString("fr-FR")} MDH sont
    concentrés sur les ${stats.alertes.count} adhérents à risque à fort CA — cible prioritaire
    pour les chargés d'affaires cette semaine.
  </div>

  <div class="card">
    <h2>Répartition par segment</h2>
    ${SEGMENTS.map((s) => barSegment(s, stats, maxNb)).join("")}
    <div class="legend">
      ${SEGMENTS.map(
        (s) =>
          `<span><span class="dot" style="background:${esc(s.color)}"></span>${esc(s.name)} (${stats.segments[s.name].score_moyen}/100 moyen)</span>`,
      ).join("")}
    </div>
  </div>

  <div class="card">
    <h2>Top 10 des alertes prioritaires (par CA en jeu)</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Entreprise</th>
          <th>Secteur</th>
          <th>Filière</th>
          <th class="num">CA (MDH)</th>
          <th class="num">Score</th>
          <th class="num">Évt</th>
          <th class="num">Email</th>
          <th class="num">Svcs</th>
          <th class="num">Digit.</th>
        </tr>
      </thead>
      <tbody>${topRows}</tbody>
    </table>
  </div>

  <div class="card">
    <h2>Méthodologie</h2>
    <p><strong>Formule du score composite (0-100) :</strong>
    events × 0.30 + email × 0.25 + services × 0.20 + digital × 0.15 + dynamique × 0.10</p>
    <ul>
      <li><strong>Événements</strong> — participations 12 derniers mois, normalisées par la médiane de la filière</li>
      <li><strong>Email</strong> — taux d'ouverture simulé (0 si opt-in = Non)</li>
      <li><strong>Services</strong> — nombre de services distincts utilisés / 11 services CFCIM</li>
      <li><strong>Digital</strong> — App MyCFCIM (60 pts) + opt-in email (40 pts)</li>
      <li><strong>Dynamique</strong> — évolution vs trimestre précédent : hausse / stable / baisse</li>
    </ul>
  </div>

  <footer>
    Généré automatiquement par le pipeline <code>projet-2-scoring</code> — CFCIM Intelligence Platform
  </footer>
</div>
</body>
</html>`;
}

function buildMarkdownRecap(stats, top10) {
  const segOrder = ["Champion", "Actif engagé", "Modéré", "À risque", "Dormant"];
  const segLines = segOrder
    .map((n) => {
      const s = stats.segments[n];
      return `| ${n} | ${s.nb} | ${s.pct}% | ${s.score_moyen}/100 | ${s.ca_total_mdh.toLocaleString("fr-FR")} |`;
    })
    .join("\n");
  const topLines = top10
    .map(
      (a, i) =>
        `| ${i + 1} | ${a.Entreprise} | ${a.Secteur} | ${a["Filière_CFCIM"]} | ${a.CA_Estimé_MDH} | ${a.Score_Calculé}/100 |`,
    )
    .join("\n");

  return `# Récap Scoring d'Engagement CFCIM — ${stats.date?.slice(0, 10) ?? ""}

## Chiffres-clés

- **500** adhérents analysés sur 5 onglets du dataset PowerBI
- **${stats.alertes.count}** alertes prioritaires détectées (Score < 30 ∧ CA > 5 MDH)
- **${stats.alertes.ca_total_mdh.toLocaleString("fr-FR")} MDH** de CA en jeu sur les alertes
- **5** segments automatiquement attribués via seuils fixes

## Répartition par segment

| Segment | Nb | % | Score moyen | CA total (MDH) |
|---------|----|----|-------------|----------------|
${segLines}

## Top 10 alertes prioritaires (par CA)

| # | Entreprise | Secteur | Filière | CA (MDH) | Score |
|---|------------|---------|---------|----------|-------|
${topLines}

## Formule du score composite

\`\`\`
SCORE = events × 0.30 + email × 0.25 + services × 0.20 + digital × 0.15 + dynamique × 0.10
\`\`\`

| Composante | Signal métier |
|------------|---------------|
| Événements | Participation réelle au réseau CFCIM (12 mois glissants, normalisé filière) |
| Email | Engagement sur les campagnes (simulé à partir de Score_Engagement existant) |
| Services | Étendue de l'usage de l'offre CFCIM (11 services disponibles) |
| Digital | Présence sur les canaux numériques (App MyCFCIM + opt-in) |
| Dynamique | Trajectoire : en hausse / stable / en baisse vs trimestre précédent |

## Livrables générés

- \`demo/CFCIM_Scored.xlsx\` — dataset enrichi (500 lignes × 25 colonnes)
- \`demo/stats-scoring.json\` — agrégats JSON
- \`demo/alertes/\` — ${stats.alertes.count} emails HTML d'alerte (un par adhérent)
- \`demo/presentation/dashboard.html\` — dashboard visuel synthétique
- \`demo/presentation/adherents-scored.csv\` — export CSV complet
- \`demo/presentation/top-10-alertes.csv\` — top 10 alertes par CA
`;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const stats = JSON.parse(await fs.readFile(STATS_JSON, "utf-8"));
  const wb = xlsx.readFile(SCORED_XLSX);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  const alerts = rows
    .filter(
      (r) =>
        Number(r.Score_Calculé) < 30 && Number(r.CA_Estimé_MDH ?? 0) > 5,
    )
    .sort((a, b) => Number(b.CA_Estimé_MDH) - Number(a.CA_Estimé_MDH));

  const top10 = alerts.slice(0, 10);

  const dashboardHTML = buildDashboard(stats, top10, rows);
  await fs.writeFile(path.join(OUT, "dashboard.html"), dashboardHTML, "utf-8");

  const fullColumns = [
    "ID_Adherent", "Entreprise", "Secteur", "Filière_CFCIM", "Région", "Taille",
    "CA_Estimé_MDH", "Score_Engagement", "Score_Calculé",
    "score_events", "score_email", "score_services", "score_digital", "score_dynamique",
    "Segment", "Nb_Participations_12m", "Nb_Services_Distincts",
    "Email_Optin", "App_MyCFCIM", "Date_Calcul",
  ];
  await fs.writeFile(
    path.join(OUT, "adherents-scored.csv"),
    toCSV(rows, fullColumns),
    "utf-8",
  );

  const topCols = [
    "ID_Adherent", "Entreprise", "Secteur", "Filière_CFCIM", "Région",
    "CA_Estimé_MDH", "Score_Calculé", "Segment",
    "score_events", "score_email", "score_services", "score_digital", "score_dynamique",
  ];
  await fs.writeFile(
    path.join(OUT, "top-10-alertes.csv"),
    toCSV(top10, topCols),
    "utf-8",
  );

  const md = buildMarkdownRecap(stats, top10);
  await fs.writeFile(path.join(OUT, "stats-recap.md"), md, "utf-8");

  console.log(`[presentation] 4 livrables générés dans demo/presentation/`);
  console.log(`  - dashboard.html (${dashboardHTML.length} caractères)`);
  console.log(`  - adherents-scored.csv (${rows.length} lignes)`);
  console.log(`  - top-10-alertes.csv (${top10.length} lignes)`);
  console.log(`  - stats-recap.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
