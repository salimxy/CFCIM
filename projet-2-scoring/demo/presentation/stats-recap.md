# Récap Scoring d'Engagement CFCIM — 2026-04-21

## Chiffres-clés

- **500** adhérents analysés sur 5 onglets du dataset PowerBI
- **62** alertes prioritaires détectées (Score < 30 ∧ CA > 5 MDH)
- **16 144,1 MDH** de CA en jeu sur les alertes
- **5** segments automatiquement attribués via seuils fixes

## Répartition par segment

| Segment | Nb | % | Score moyen | CA total (MDH) |
|---------|----|----|-------------|----------------|
| Champion | 0 | 0% | 0/100 | 0 |
| Actif engagé | 94 | 19% | 63/100 | 15 789,5 |
| Modéré | 223 | 45% | 50/100 | 50 611,4 |
| À risque | 133 | 27% | 32/100 | 34 799 |
| Dormant | 50 | 10% | 11/100 | 6 758,1 |

## Top 10 alertes prioritaires (par CA)

| # | Entreprise | Secteur | Filière | CA (MDH) | Score |
|---|------------|---------|---------|----------|-------|
| 1 | Global Industries | IT & Digital | Art de vivre & Santé | 1727.3 | 24/100 |
| 2 | Casa Trading | Santé & Pharma | Industrie & Infrastructures | 1661.5 | 29/100 |
| 3 | Smart Foods | Agroalimentaire | Agrotech | 1594.8 | 28/100 |
| 4 | Atlas Energy | Automobile | Art de vivre & Santé | 1569.5 | 13/100 |
| 5 | Tech Transport | Télécoms | Agrotech | 1364.2 | 15/100 |
| 6 | Vision Agri | Logistique & Transport | Tech & Services | 1314.5 | 27/100 |
| 7 | Casa Logistics | IT & Digital | Tech & Services | 1248.6 | 25/100 |
| 8 | Euro Services | Logistique & Transport | Industrie & Infrastructures | 974.5 | 13/100 |
| 9 | Rif Services | IT & Digital | Tech & Services | 913.5 | 14/100 |
| 10 | Franco Energy | Énergie & Environnement | Industrie & Infrastructures | 287 | 27/100 |

## Formule du score composite

```
SCORE = events × 0.30 + email × 0.25 + services × 0.20 + digital × 0.15 + dynamique × 0.10
```

| Composante | Signal métier |
|------------|---------------|
| Événements | Participation réelle au réseau CFCIM (12 mois glissants, normalisé filière) |
| Email | Engagement sur les campagnes (simulé à partir de Score_Engagement existant) |
| Services | Étendue de l'usage de l'offre CFCIM (11 services disponibles) |
| Digital | Présence sur les canaux numériques (App MyCFCIM + opt-in) |
| Dynamique | Trajectoire : en hausse / stable / en baisse vs trimestre précédent |

## Livrables générés

- `demo/CFCIM_Scored.xlsx` — dataset enrichi (500 lignes × 25 colonnes)
- `demo/stats-scoring.json` — agrégats JSON
- `demo/alertes/` — 62 emails HTML d'alerte (un par adhérent)
- `demo/presentation/dashboard.html` — dashboard visuel synthétique
- `demo/presentation/adherents-scored.csv` — export CSV complet
- `demo/presentation/top-10-alertes.csv` — top 10 alertes par CA
