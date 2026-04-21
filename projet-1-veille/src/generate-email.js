import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(__dirname, "..", "templates", "email-veille.html");
const INPUT = path.join(__dirname, "..", "data", "articles-classified.json");
const OUTPUT = path.join(__dirname, "..", "data", "email-veille.html");

// Couleurs associées à chaque filière CFCIM
const FILIERE_COLORS = {
  "Industrie & Infrastructures": { bg: "#1B3A5C", light: "#e8edf3" },
  "Agrotech":                    { bg: "#2D7D46", light: "#e8f5ec" },
  "Tech & Services":             { bg: "#1565C0", light: "#e3edf9" },
  "Art de vivre & Santé":        { bg: "#8B4080", light: "#f4ecf3" },
  "Cleantech":                   { bg: "#00796B", light: "#e0f2f1" },
  "Transversal":                 { bg: "#C5A55A", light: "#fdf8ef" },
};

// Échappement HTML pour éviter toute injection depuis les flux RSS ou l'IA
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Valide que l'URL est bien http/https pour éviter les liens javascript:
function safeHref(value = "") {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

function buildArticleHtml(article) {
  const cdmBadge = article.coupe_du_monde_2030
    ? `<span style="display:inline-block;background:#C5A55A;color:#1B3A5C;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:8px;">🏆 CDM 2030</span>`
    : "";

  const motsCles = Array.isArray(article.mots_cles) && article.mots_cles.length
    ? `<p style="margin:6px 0 0;">${article.mots_cles.map((m) => `<span style="display:inline-block;background:#f0f0f0;color:#555;font-size:11px;padding:1px 7px;border-radius:10px;margin:2px 2px 2px 0;">${escapeHtml(m)}</span>`).join("")}</p>`
    : "";

  return `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #eeeeee;">
        <h3 style="margin:0 0 6px;font-size:15px;font-weight:700;line-height:1.4;">
          <a href="${safeHref(article.lien)}" style="color:#1B3A5C;text-decoration:none;">${escapeHtml(article.titre)}</a>${cdmBadge}
        </h3>
        <p style="margin:0 0 6px;font-size:12px;color:#888;">
          ${escapeHtml(article.source)} — ${new Date(article.date).toLocaleDateString("fr-FR")}
        </p>
        <p style="margin:0 0 6px;font-size:14px;color:#333;line-height:1.5;">${escapeHtml(article.resume)}</p>
        ${article.implications ? `<p style="margin:0;font-size:13px;color:#555;font-style:italic;">💡 ${escapeHtml(article.implications)}</p>` : ""}
        ${motsCles}
      </td>
    </tr>`;
}

function buildSectionHtml(filiere, articles) {
  const colors = FILIERE_COLORS[filiere] ?? FILIERE_COLORS["Transversal"];
  const articlesHtml = articles.map(buildArticleHtml).join("\n");

  return `
    <!-- Section ${escapeHtml(filiere)} -->
    <tr>
      <td style="padding:0 40px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:${colors.bg};padding:10px 18px;border-radius:4px 4px 0 0;">
              <h2 style="margin:0;color:#ffffff;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">
                ${escapeHtml(filiere)} (${articles.length})
              </h2>
            </td>
          </tr>
          <tr>
            <td style="background:${colors.light};padding:0 18px 8px;border-radius:0 0 4px 4px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${articlesHtml}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export async function generateEmail(articles) {
  const template = await fs.readFile(TEMPLATE, "utf-8");

  // Groupe par filière, trie par pertinence décroissante
  const byFiliere = {};
  for (const a of articles) {
    const key = a.filiere_cfcim ?? "Transversal";
    if (!byFiliere[key]) byFiliere[key] = [];
    byFiliere[key].push(a);
  }

  // Ordre d'affichage des filières
  const FILIERE_ORDER = [
    "Industrie & Infrastructures",
    "Agrotech",
    "Tech & Services",
    "Art de vivre & Santé",
    "Cleantech",
    "Transversal",
  ];

  const sectionsHtml = FILIERE_ORDER.filter((f) => byFiliere[f]?.length)
    .map((f) => {
      const sorted = byFiliere[f].sort((a, b) => b.pertinence - a.pertinence);
      return buildSectionHtml(f, sorted);
    })
    .join("\n");

  // Remplace TOUS les occurrences de {{DATE}} (titre + corps)
  const date = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = template
    .replaceAll("{{DATE}}", date)
    .replace("{{COUNT}}", String(articles.length))
    .replace("{{SECTIONS}}", sectionsHtml);

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, html);
  console.log(`[email] généré → ${OUTPUT} (${articles.length} articles)`);
  return html;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const articles = JSON.parse(await fs.readFile(INPUT, "utf-8"));
  generateEmail(articles).catch(console.error);
}
