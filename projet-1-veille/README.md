# Projet 1 — Veille Économique Automatisée

Pipeline quotidien de veille sectorielle France–Maroc pour la CFCIM.

## Fonctionnement

```
Flux RSS (6 sources) → Collecte → Classification Claude → Stockage JSON → Email HTML
```

1. **Collecte** parallèle de 6 sources marocaines (Médias24, L'Économiste, La Vie Éco…)
2. **Déduplication** par similarité de titre (Levenshtein ≥ 0.8)
3. **Classification** via Claude : filière CFCIM, pertinence 1-5, résumé, implications, flag CDM2030
4. **Filtrage** : seuls les articles de pertinence ≥ 3 sont retenus
5. **Email HTML** responsive structuré par filière avec badges Coupe du Monde 2030

## Les 5 filières CFCIM

| Filière | Couleur |
|---------|---------|
| Industrie & Infrastructures | Bleu marine `#1B3A5C` |
| Agrotech | Vert `#2D7D46` |
| Tech & Services | Bleu `#1565C0` |
| Art de vivre & Santé | Violet `#8B4080` |
| Cleantech | Vert turquoise `#00796B` |
| Transversal | Doré `#C5A55A` |

## Installation

```bash
# Depuis la racine du monorepo
npm install

# Ou depuis ce dossier
cd projet-1-veille
npm install
```

## Configuration

```bash
cp ../../.env.example ../../.env
# Remplir les clés :
# ANTHROPIC_API_KEY=sk-ant-...
```

## Lancement

```bash
# Mode démo — aucune clé API requise
node index.js --demo

# Mode production
node index.js

# Scripts individuels
npm run collect      # collecte RSS uniquement
npm run classify     # classification uniquement
npm run email        # génération email uniquement
npm run generate-demo  # génère demo/exemple-output.html
```

## Structure

```
projet-1-veille/
├── index.js               # Point d'entrée (orchestrateur)
├── src/
│   ├── collect.js         # Collecte RSS parallèle + déduplication
│   ├── classify.js        # Classification Claude (batch de 5)
│   ├── generate-email.js  # Email HTML responsive par filière
│   └── store.js           # Stockage JSON quotidien + archive
├── templates/
│   └── email-veille.html  # Template email inline-styles
├── config/
│   └── sources.json       # Sources RSS (modifiable sans toucher au code)
├── data/                  # Données générées (gitignored)
│   ├── articles-raw.json
│   ├── articles-classified.json
│   ├── email-veille.html
│   └── archive.json
├── n8n/
│   └── workflow-veille.json  # Workflow n8n importable
└── demo/
    ├── generate-demo.js      # Génère l'email de démo
    └── exemple-output.html   # Email exemple (12 articles fictifs)
```

## n8n

Importer `n8n/workflow-veille.json` dans n8n (http://localhost:5678).

> **Important** : le `docker-compose.yml` monte `./projet-1-veille` dans `/workflows/veille`
> afin que les scripts `src/` soient accessibles.

## Ajouter une source RSS

Éditer `config/sources.json` :

```json
{
  "name": "Nom de la source",
  "url": "https://example.com/rss",
  "category": "presse-ma"
}
```

Aucun changement de code requis.
