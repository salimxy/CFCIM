# CFCIM Intelligence Platform

Plateforme d'intelligence économique et d'automatisation au service de la **Chambre Française de Commerce et d'Industrie du Maroc (CFCIM)**.

Elle regroupe trois projets complémentaires qui exploitent l'IA (Claude API), l'automatisation (n8n) et la donnée membres pour augmenter la valeur délivrée aux adhérents et la performance des équipes.

---

## Vision

Transformer la CFCIM en **organisation data-driven** : détecter les signaux faibles de l'économie franco-marocaine, anticiper les besoins des membres, et personnaliser chaque interaction pour maximiser l'engagement et la rétention.

## Les trois projets

### Projet 1 — Veille Économique Automatisée (`projet-1-veille/`)
Collecte quotidienne de sources RSS sectorielles, classification par Claude, et diffusion d'une newsletter HTML personnalisée aux membres.

### Projet 2 — Scoring d'Engagement (`projet-2-scoring/`)
Modèle de scoring multicritère des membres, segmentation automatique (Champions, À risque, Dormants...), alertes aux chargés de compte et recommandations d'actions générées par IA.

### Projet 3 — Recommandation & Matching (`projet-3-matching/`)
Moteur de matching entre membres et événements/opportunités à venir, avec génération d'emails d'invitation personnalisés par Claude.

## Architecture

```
┌───────────────────────────────┐
│   Sources (RSS, Excel CFCIM)  │
└──────────────┬────────────────┘
               │
        ┌──────▼──────┐
        │    n8n      │  orchestration
        └──────┬──────┘
               │
   ┌───────────┼────────────┐
   ▼           ▼            ▼
 Veille    Scoring      Matching
   │           │            │
   └────┬──────┴──────┬─────┘
        ▼             ▼
   Claude API   Google Sheets / SMTP
```

Le dossier `shared/` contient les clients réutilisables (Claude, Sheets, SMTP, data-loader).

## Prérequis

- Node.js ≥ 20
- Docker + Docker Compose
- Clés : `ANTHROPIC_API_KEY`, SMTP, Google Sheets API

## Démarrage rapide

```bash
# 1. Cloner et installer
git clone <repo>
cd cfcim-intelligence-platform
cp .env.example .env   # puis remplir les clés
npm install            # installe les workspaces

# 2. Lancer n8n
docker compose up -d

# 3. Lancer un projet
npm run start --workspace=projet-1-veille
npm run start --workspace=projet-2-scoring
npm run start --workspace=projet-3-matching
```

Chaque sous-projet dispose de son propre `README.md` avec instructions détaillées.

## Documentation

- [Architecture technique](docs/architecture.md)
- [Stack technique](docs/stack-technique.md)
- [Plan 90 jours](docs/plan-90-jours.md)
- [Processus BPMN](docs/bpmn-processus.md)

## Licence

Voir [LICENSE](LICENSE).
