import fs from "node:fs/promises";
import path from "node:path";

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

// Les opérations d'écriture requièrent OAuth2 / Service Account (pas une API key)
// Ce module utilise un service account JSON dont le chemin est dans GOOGLE_SERVICE_ACCOUNT_KEY_PATH

let _accessToken = null;
let _tokenExpiry = 0;

async function getAccessToken() {
  if (_accessToken && Date.now() < _tokenExpiry - 60_000) return _accessToken;

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyPath) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_PATH manquant dans .env");

  const key = JSON.parse(await fs.readFile(path.resolve(keyPath), "utf-8"));

  // Génère un JWT signé pour l'échange contre un access token
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  const { createSign } = await import("node:crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(key.private_key, "base64url");
  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`OAuth token error: ${res.status} ${await res.text()}`);
  const json = await res.json();

  _accessToken = json.access_token;
  _tokenExpiry = Date.now() + json.expires_in * 1000;
  return _accessToken;
}

export async function appendRows(spreadsheetId, range, values) {
  const token = await getAccessToken();
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) throw new Error(`Sheets append failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function readRange(spreadsheetId, range) {
  const token = await getAccessToken();
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Sheets read failed: ${res.status}`);
  const json = await res.json();
  return json.values ?? [];
}
