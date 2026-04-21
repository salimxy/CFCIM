# Pack de présentation — Scoring d'engagement CFCIM

Livrables prêts pour démonstration du pipeline `projet-2-scoring`, générés
à partir du dataset `CFCIM_Dataset_PowerBI.xlsx` (500 adhérents).

## Contenu

| Fichier | Usage slide / démo |
|---------|--------------------|
| `dashboard.html` | **À montrer en plein écran** — KPIs, segments, top 10 alertes, méthodologie |
| `stats-recap.md` | Récap markdown à copier-coller dans les slides (tables Markdown) |
| `console-output.txt` | Capture terminal du pipeline (preuve d'exécution reproductible) |
| `top-10-alertes.csv` | Export Excel/Sheets pour revue chargés d'affaires |
| `adherents-scored.csv` | Export complet des 500 adhérents scorés (pivotable) |
| `exemples-alertes/` | 3 emails HTML annotés par profil d'alerte |

## 3 exemples d'alertes sélectionnés

1. **`01-top-ca-ADH-0351.html`** — *Global Industries*, plus gros CA en risque
   (1 727 MDH). Illustre l'impact business d'un désengagement.
2. **`02-faible-evenements-ADH-0029.html`** — *Smart Energy*, score événements
   le plus faible. Illustre la composante "événements" comme signal fort.
3. **`03-dormant-ancien-ADH-0435.html`** — *Prime Foods*, ancienneté 10+ ans
   passée en segment Dormant. Illustre la perte d'un adhérent historique.

## Scénario de démo suggéré (5 min)

1. Ouvrir `dashboard.html` → montrer les 4 KPIs et les barres par segment
2. Dérouler le top 10 → pointer la concentration du CA à risque
3. Ouvrir `exemples-alertes/01-top-ca-ADH-0351.html` → profil + composantes + IA
4. Montrer `console-output.txt` → reproductibilité : `node src/index.js --demo`
5. Ouvrir `top-10-alertes.csv` dans Excel → export actionnable

## Reproduire les livrables

```bash
# Depuis la racine du monorepo
node projet-2-scoring/src/index.js --demo           # stats + emails + Excel
node projet-2-scoring/scripts/build-presentation.js # dashboard + CSV + recap MD
```
