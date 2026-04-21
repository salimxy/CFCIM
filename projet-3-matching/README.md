# Projet 3 — Recommandation & Matching IA

Moteur de matching entre membres CFCIM et événements/opportunités à venir.

## Fonctionnement

1. **events-loader.js** — charge la liste des événements à venir depuis `data/evenements-a-venir.json`.
2. **matching.js** — applique les règles (filière, région, taille entreprise) pour chaque couple (membre × événement).
3. **personalize.js** — Claude rédige un email d'invitation personnalisé pour chaque match.

## Structure

```
projet-3-matching/
├── src/
│   ├── matching.js
│   ├── personalize.js
│   └── events-loader.js
├── config/
│   └── matching-rules.json
├── data/
│   ├── CFCIM_Dataset_PowerBI.xlsx
│   └── evenements-a-venir.json
├── n8n/
│   └── workflow-matching.json
└── demo/
    ├── exemple-emails-personnalises.html
    └── comparatif-5-profils.md
```

## Lancer

```bash
npm run matching
```

## Règles de matching

Définies dans `config/matching-rules.json` (filières connexes, régions limitrophes, seuils).
