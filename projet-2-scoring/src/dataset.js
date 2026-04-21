import fs from "node:fs";
import xlsx from "xlsx";

const SHEETS = {
  adherents: "Adhérents",
  evenements: "Événements",
  participations: "Participations",
  campagnes: "Campagnes",
  services: "Services_Utilisés",
};

function readSheet(wb, name) {
  const sheet = wb.Sheets[name];
  if (!sheet) throw new Error(`Onglet "${name}" introuvable`);
  return xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false });
}

export function parseBoolFr(value) {
  if (value == null) return false;
  return String(value).trim().toLowerCase() === "oui";
}

export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function loadDataset(xlsxPath) {
  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`Dataset introuvable : ${xlsxPath}`);
  }
  const wb = xlsx.readFile(xlsxPath);
  return {
    adherents: readSheet(wb, SHEETS.adherents),
    evenements: readSheet(wb, SHEETS.evenements),
    participations: readSheet(wb, SHEETS.participations),
    campagnes: readSheet(wb, SHEETS.campagnes),
    services: readSheet(wb, SHEETS.services),
  };
}
