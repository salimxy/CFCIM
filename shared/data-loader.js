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

function normalize(row) {
  return {
    id: row.id ?? row.ID ?? row.MemberId,
    raison_sociale: row.raison_sociale ?? row["Raison sociale"] ?? row.Name,
    filiere: row.filiere ?? row["Filière"] ?? row.Sector,
    region: row.region ?? row["Région"] ?? row.Region,
    taille: row.taille ?? row["Taille"] ?? row.Size,
    anciennete_years: row.anciennete_years ?? row["Ancienneté"] ?? 0,
    events_attended: row.events_attended ?? row["Evenements"] ?? 0,
    email_opens: row.email_opens ?? row["Ouvertures emails"] ?? 0,
    cotisation_a_jour: Boolean(row.cotisation_a_jour ?? row["Cotisation"] ?? false),
    dernier_contact_jours: row.dernier_contact_jours ?? row["Jours depuis contact"] ?? 999,
    contact_email: row.contact_email ?? row["Email"] ?? null,
    account_manager: row.account_manager ?? null,
  };
}
