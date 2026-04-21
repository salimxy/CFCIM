# Comparatif matching — 5 profils types

Simulation du moteur de matching sur 5 membres CFCIM représentatifs.

Scores maximum possibles avec les règles actuelles :
- Filière exacte (40) + Région exacte (25) + Taille (15) = **80 pts max**
- Filière connexe (20) + Région limitrophe (10) + Taille (15) = 45 pts

| # | Membre | Filière | Région | Taille | Score | Événement matchant |
|---|--------|---------|--------|--------|-------|--------------------|
| 1 | ACME Automotive | Automobile | Tanger-Tétouan | ETI | **80** | Forum Automobile 2026 |
| 2 | Coopérative BioSouss | Agroalimentaire | Souss-Massa | PME | **65** | SIAM — Pavillon France |
| 3 | SolarTech Rabat | Énergie | Rabat-Salé-Kénitra | PME | **60** | Rencontres Énergie verte |
| 4 | TextilCasa | Textile | Casablanca-Settat | PME | **50** | Matinée Financement export |
| 5 | BTP Fès Invest | BTP | Fès-Meknès | ETI | **40** | Rencontres Énergie verte |

> Scores calculés depuis `config/matching-rules.json` :
> `exact_filiere=40, filiere_connexe=20, exact_region=25, region_limitrophe=10, taille_match=15, seuil_minimum=40`

## Lecture

- Les matches **filière exacte + région exacte + taille** atteignent le maximum de **80 pts**.
- Le matching est **symétrique** : BTP membre → Énergie événement est équivalent à Énergie membre → BTP événement (filières connexes bidirectionnelles).
- Le **seuil de 40** filtre le bruit tout en capturant les opportunités transversales.

## Personnalisation Claude

Chaque profil reçoit un email dont le ton est adapté à sa filière : technique pour l'automobile, orienté "partenariat" pour l'agro, "innovation" pour l'énergie verte.
