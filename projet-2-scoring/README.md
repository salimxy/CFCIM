# Projet 2 — Scoring d'Engagement

Système de scoring automatique (0-100) pour les 4000+ adhérents de la CFCIM.
Détecte les adhérents en désengagement, produit des alertes ciblées et génère
des recommandations d'action personnalisées via Claude.

## Lancer en mode démo (sans clé API)

```bash
# Depuis la racine du monorepo
npm install
node projet-2-scoring/src/index.js --demo
```

Le mode démo fonctionne entièrement en local avec des recommandations template ;
aucun appel à l'API Claude n'est effectué.

## Pipeline

1. **`src/scoring.js`** — score composite 0-100 calculé à partir des 5 onglets
   du dataset (Adhérents, Participations, Événements, Campagnes, Services_Utilisés).
2. **`src/segmentation.js`** — 5 segments colorés (Champion, Actif engagé, Modéré,
   À risque, Dormant).
3. **`src/alerts.js`** — alerte sur chaque adhérent `Score_Calculé < 30 ∧ CA > 5 MDH`.
4. **`src/recommend.js`** — diagnostic + 3 actions + email d'approche (Claude ou template).

### Formule du score composite

```
SCORE_TOTAL = events × 0.30 + email × 0.25 + services × 0.20
            + digital × 0.15 + dynamique × 0.10
```

| Composante | Règle |
|------------|-------|
| `events`     | `min(100, (participations 12 mois / médiane filière) × 100)`, 0 si aucune |
| `email`      | `Email_Optin=Non` → 0 ; sinon `(Score_Engagement/100 × 0.4 + bruit) × 100` |
| `services`   | `(services distincts / 11) × 100` |
| `digital`    | `App_MyCFCIM=Oui` → 60 pts + `Email_Optin=Oui` → 40 pts (plafonné) |
| `dynamique`  | vs `Score_Engagement` précédent : hausse +5 → 100, ±5 → 50, baisse −5 → 0 |

Pondérations modifiables dans `config/scoring-weights.json`.

### Seuils de segmentation

| Segment | Score | Couleur |
|---------|-------|---------|
| Champion      | 80-100 | `#2E7D32` |
| Actif engagé  | 60-79  | `#66BB6A` |
| Modéré        | 40-59  | `#FFA726` |
| À risque      | 20-39  | `#EF6C00` |
| Dormant       | 0-19   | `#C62828` |

## Livrables

- `demo/CFCIM_Scored.xlsx` — dataset enrichi (score composite + 5 composantes + segment)
- `demo/stats-scoring.json` — stats agrégées par segment + résumé alertes
- `demo/alertes/alerte-{ID}.html` — un email HTML par adhérent en alerte

## Mode production

Avec `ANTHROPIC_API_KEY` défini dans `.env`, lancer sans `--demo` :

```bash
node projet-2-scoring/src/index.js
```

Le workflow `n8n/workflow-scoring.json` orchestre la planification hebdomadaire
(lundi 7h) : Google Sheets → Code scoring → IF (score<30 ∧ CA>5) → Claude API → Email.

## Structure

```
projet-2-scoring/
├── src/
│   ├── dataset.js       # loader multi-onglets Excel
│   ├── scoring.js       # calcul du score composite
│   ├── segmentation.js  # 5 segments + stats
│   ├── alerts.js        # filtre CA + rendu HTML
│   ├── recommend.js     # Claude ou fallback template
│   └── index.js         # orchestrateur + flag --demo
├── config/
│   └── scoring-weights.json
├── data/
│   ├── CFCIM_Dataset_PowerBI.xlsx  # source (500 adhérents, 5 onglets)
│   └── CFCIM_Scored.xlsx           # généré (gitignoré)
├── n8n/
│   └── workflow-scoring.json
└── demo/
    ├── CFCIM_Scored.xlsx
    ├── stats-scoring.json
    └── alertes/
        └── alerte-ADH-*.html
```
