# Plan d'action 90 jours

## Objectifs

Livrer les 3 projets en production avec mesure d'impact dès J+90.

## Chronologie

### Phase 1 — Fondations (J0 → J30)

| Semaine | Livrables |
|---------|-----------|
| S1 | Setup repo, Docker n8n, clés API, accès Google Sheets |
| S2 | **Projet Veille** : collecte + classification Claude (MVP) |
| S3 | **Projet Veille** : template email + archive Sheets + workflow n8n |
| S4 | Démo interne Veille — recette équipe communication |

### Phase 2 — Scoring & Alertes (J31 → J60)

| Semaine | Livrables |
|---------|-----------|
| S5 | **Projet Scoring** : ingestion dataset + calcul scores |
| S6 | **Projet Scoring** : segmentation + recommandations Claude |
| S7 | **Projet Scoring** : alertes SMTP aux chargés de compte + dashboard |
| S8 | Recette métier avec direction membres, ajustement pondérations |

### Phase 3 — Matching & Consolidation (J61 → J90)

| Semaine | Livrables |
|---------|-----------|
| S9  | **Projet Matching** : règles filières/régions + algorithme |
| S10 | **Projet Matching** : personalisation Claude + envoi test |
| S11 | Intégration des 3 workflows dans n8n, monitoring, gestion erreurs |
| S12 | Bilan J+90 — KPI et roadmap trimestre suivant |

## KPI de succès

| KPI | Baseline | Cible J+90 |
|-----|----------|-----------|
| Taux d'ouverture newsletter veille | 18% (bench) | **>35%** |
| Temps passé par l'équipe à préparer la veille | 6h/semaine | **<30min/semaine** |
| Membres réengagés après alerte | — | **>15%** |
| Taux d'inscription aux événements via matching | — | **+25%** vs campagne généraliste |
| Coût IA mensuel | — | **<500€/mois** |

## Risques & mitigations

| Risque | Mitigation |
|--------|-----------|
| Qualité de classification Claude variable | Prompt versionné + eval manuelle 50 articles/semaine |
| Bruit dans les alertes scoring | Pondérations ajustables + seuils révisés après S8 |
| Volumétrie emails > limite SMTP | Utilisation Brevo / SendGrid si >10k/mois |
| Données membres obsolètes | Synchro hebdo du dataset depuis le CRM CFCIM |
