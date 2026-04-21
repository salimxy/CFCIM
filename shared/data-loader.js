import fs from "node:fs";
import xlsx from "xlsx";

export async function loadMembers(xlsxPath) {
  if (!fs.existsSync(xlsxPath)) {
    console.warn(`[data-loader] ${xlsxPath} introuvable — retour d'un dataset vide`);
    return [];
  }
  const wb = xlsx.readFile(xlsxPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
  return rows.map(normalize);
}

// Convertit les valeurs textuelles en booléen (gère "Oui", "Non", "1", "0", etc.)
function toBool(v) {
  if (v == null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  return ["oui", "true", "1", "yes", "x"].includes(String(v).trim().toLowerCase());
}

// Convertit en nombre avec valeur par défaut
function toNumber(v, defaultValue = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultValue;
}

function normalize(row) {
  return {
    id: row.id ?? row.ID ?? row.MemberId,
    raison_sociale: row.raison_sociale ?? row["Raison sociale"] ?? row.Name,
    filiere: row.filiere ?? row["Filière"] ?? row.Sector,
    region: row.region ?? row["Région"] ?? row.Region,
    taille: row.taille ?? row["Taille"] ?? row.Size,
    anciennete_years: toNumber(row.anciennete_years ?? row["Ancienneté"]),
    events_attended: toNumber(row.events_attended ?? row["Evenements"]),
    email_opens: toNumber(row.email_opens ?? row["Ouvertures emails"]),
    cotisation_a_jour: toBool(row.cotisation_a_jour ?? row["Cotisation"]),
    dernier_contact_jours: toNumber(row.dernier_contact_jours ?? row["Jours depuis contact"], 999),
    contact_email: row.contact_email ?? row["Email"] ?? null,
    account_manager: row.account_manager ?? null,
  };
}
