# Architecture technique

## Vue d'ensemble

```text
┌─────────────────────────────────────────────────────────────────┐
│                     CFCIM Intelligence Platform                 │
└─────────────────────────────────────────────────────────────────┘

   Sources externes                  Orchestration             IA / Stockage
  ┌────────────────┐             ┌────────────────┐         ┌────────────────┐
  │ Flux RSS        │─────►      │                │ ─────►  │ Claude API     │
  │ Dataset CFCIM   │─────►      │   n8n          │         │ (classify,     │
  │ Calendrier      │─────►      │   workflows    │         │  recommend,    │
  │ événements      │            │   (cron, wh)   │         │  personalize)  │
  └────────────────┘             │                │         └────────────────┘
                                 │                │ ─────►  ┌────────────────┐
                                 │                │         │ Google Sheets  │
                                 │                │         │ (archive)      │
                                 │                │ ─────►  └────────────────┘
                                 │                │         ┌────────────────┐
                                 └───────┬────────┘         │ SMTP           │
                                         │                  │ (emails)       │
                                         ▼                  └────────────────┘
                               ┌────────────────────────┐
                               │ Node.js workspaces     │
                               │  • projet-1-veille     │
                               │  • projet-2-scoring    │
                               │  • projet-3-matching   │
                               │  • shared              │
                               └────────────────────────┘
```

## Découpage

Chaque projet est un workspace npm indépendant, mais réutilise `shared/` pour :

- `claude-client.js` — singleton Anthropic SDK
- `data-loader.js` — lecture uniforme du dataset Excel CFCIM
- `email-sender.js` — envoi SMTP via nodemailer
- `sheets-client.js` — Google Sheets API v4 (REST)

## Flux type — Projet Veille

1. n8n Cron (7h, L-V) déclenche `node src/index.js`
2. `collect.js` parse les RSS, produit `data/articles-raw.json`
3. `classify.js` envoie chaque article à Claude → `articles-classified.json`
4. `store.js` archive dans Google Sheets
5. `generate-email.js` produit `email-veille.html`
6. n8n node SMTP envoie la newsletter

## Déploiement

- **Dev** : `docker compose up` pour n8n local, scripts Node lancés à la main.
- **Prod** : VPS + n8n + cron natif ; secrets via `.env` monté en volume.

## Sécurité

- Aucune clé en dur — tout passe par `.env` (gitignored)
- Toutes les données générées sous `data/` (JSON, HTML, XLSX, CSV) sont gitignored via `**/data/*` — les données membres et les emails produits ne sortent jamais du repo
- `alerts.js` ne persiste pas les adresses email des chargés de compte dans `alerts.json` (PII minimisation)
- `generate-email.js` échappe tous les champs RSS/IA avant injection HTML (protection XSS)
- Logs n'incluent pas de PII

## Observabilité

- Logs stdout capturés par n8n (onglet Executions)
- Erreurs Claude → retry avec backoff (TODO : implémenter dans `shared/claude-client.js`)
