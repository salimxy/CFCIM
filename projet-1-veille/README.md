# Projet 1 — Veille Économique Automatisée

Pipeline automatisé de veille sectorielle pour la CFCIM :

1. **Collecte** de flux RSS (presse économique, officiels, sectoriels).
2. **Classification** des articles par Claude (thème, secteur, pertinence pour les membres CFCIM).
3. **Stockage** structuré dans Google Sheets (ou JSON en fallback).
4. **Génération** d'un email HTML synthétique envoyé aux équipes / membres.

## Structure

```
projet-1-veille/
├── src/
│   ├── collect.js         # Collecte RSS
│   ├── classify.js        # Classification Claude
│   ├── generate-email.js  # Génération email HTML
│   └── store.js           # Stockage
├── templates/
│   └── email-veille.html  # Template email
├── config/
│   └── sources.json       # Sources RSS
├── n8n/
│   └── workflow-veille.json
└── demo/
    └── exemple-output.html
```

## Lancer

```bash
# Depuis la racine
npm install
npm run veille
```

Ou en mode orchestré : importer `n8n/workflow-veille.json` dans n8n (http://localhost:5678).

## Configuration

- `config/sources.json` — ajouter/retirer des flux RSS.
- `.env` racine — `ANTHROPIC_API_KEY`, SMTP, Google Sheets.
