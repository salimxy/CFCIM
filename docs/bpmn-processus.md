# Processus métier (BPMN simplifié)

Les trois processus sont décrits en pseudo-BPMN texte — à modéliser ensuite dans Bizagi/Camunda si besoin d'export XML.

---

## Processus 1 — Veille économique quotidienne

```
[Déclencheur Cron 7h]
    ↓
<Tâche automatisée> Collecter flux RSS (25+ sources)
    ↓
<Tâche automatisée> Classifier articles (Claude)
    ↓
<Décision> Articles pertinence >= 3 ?
    ├── Non → Archiver sans diffusion
    └── Oui ↓
<Tâche automatisée> Générer email HTML
    ↓
<Tâche automatisée> Envoyer newsletter (équipe → puis membres opt-in)
    ↓
<Tâche automatisée> Archiver dans Google Sheets
    ↓
[Fin]
```

**Acteurs** : n8n (orchestrateur), Claude (analyste IA), SMTP.

---

## Processus 2 — Scoring et alertes d'engagement

```
[Déclencheur Cron lundi 6h]
    ↓
<Tâche automatisée> Charger dataset CFCIM (xlsx)
    ↓
<Tâche automatisée> Calculer score 0-100 par membre
    ↓
<Tâche automatisée> Attribuer segment (Champion → Dormant)
    ↓
<Décision> Nouveau segment critique (À risque / Dormant) ?
    ├── Non → Mise à jour du dashboard
    └── Oui ↓
<Tâche automatisée> Générer 3 recommandations (Claude)
    ↓
<Tâche automatisée> Envoyer alerte email au chargé de compte
    ↓
<Tâche humaine> Chargé de compte contacte le membre (<72h)
    ↓
<Tâche humaine> Log action dans le CRM
    ↓
[Fin]
```

**Acteurs** : n8n, Claude, chargé de compte CFCIM.

---

## Processus 3 — Matching membres × événements

```
[Déclencheur Cron 1er du mois 8h OU événement ajouté]
    ↓
<Tâche automatisée> Charger événements à venir (J+7 à J+60)
    ↓
<Tâche automatisée> Matcher chaque événement avec la base membres
                    (filière, région, taille)
    ↓
<Tâche automatisée> Filtrer matches score >= 40
    ↓
<Tâche automatisée> Générer email personnalisé (Claude) pour chaque match
    ↓
<Tâche humaine> Validation RH/communication (échantillon aléatoire 5%)
    ↓
<Décision> Validation OK ?
    ├── Non → Ajuster prompts + réexécuter
    └── Oui ↓
<Tâche automatisée> Envoi des invitations (SMTP)
    ↓
<Tâche automatisée> Tracking inscriptions → Google Sheets
    ↓
[Fin]
```

**Acteurs** : n8n, Claude, équipe communication CFCIM.

---

## Synergies inter-processus

- Un membre **signalé À risque** (P2) peut être **prioritaire pour le matching** (P3) → boost de re-engagement.
- Les **articles pertinents** (P1) peuvent être injectés dans les emails d'invitation (P3) comme "Le saviez-vous ?".
- Le **score d'engagement** (P2) enrichit le matching (P3) pour éviter de sur-solliciter les Champions.
