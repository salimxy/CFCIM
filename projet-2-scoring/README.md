# Projet 2 — Scoring d'Engagement

Modèle de scoring multicritère pour les membres CFCIM.

## Fonctionnement

1. **scoring.js** — calcule un score 0-100 par membre (ancienneté, événements, cotisation, ouvertures emails, appels…).
2. **segmentation.js** — attribue un segment : Champion, Engagé, Tiède, À risque, Dormant.
3. **alerts.js** — génère des alertes aux chargés de compte pour les membres passant à un segment critique.
4. **recommend.js** — Claude propose 3 actions personnalisées par membre à risque.

## Structure

```
projet-2-scoring/
├── src/
│   ├── scoring.js
│   ├── segmentation.js
│   ├── alerts.js
│   └── recommend.js
├── config/
│   └── scoring-weights.json
├── data/
│   └── CFCIM_Dataset_PowerBI.xlsx
├── n8n/
│   └── workflow-scoring.json
└── demo/
    ├── dashboard-scoring.png
    └── exemple-alerte.html
```

## Lancer

```bash
npm run scoring
```

## Pondérations

Modifiables dans `config/scoring-weights.json` sans toucher au code.
