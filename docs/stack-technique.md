# Stack technique et justifications

## Choix principaux

| Brique | Techno retenue | Alternative écartée | Justification |
|--------|----------------|---------------------|---------------|
| Orchestration | **n8n** | Zapier, Make, Airflow | Open-source, self-hosted, UI low-code, support cron + webhooks, intégrations natives (Google, SMTP, HTTP). Alignement avec la maîtrise interne CFCIM. |
| Langage scripts | **Node.js 20 (ESM)** | Python | Meilleur pour I/O (RSS, API), écosystème mail/HTML solide, intégration n8n fluide. |
| IA | **Claude (Anthropic)** | GPT-4, Mistral | Qualité sur la rédaction française, contexte long, API stable, coût maîtrisé avec Sonnet. |
| Modèle par défaut | `claude-sonnet-4-6` | Opus / Haiku | Meilleur compromis qualité/coût/latence pour classification et rédaction. Passer à Opus pour tâches complexes, Haiku pour batch. |
| Stockage archive | **Google Sheets** | PostgreSQL, Airtable | Déjà utilisé par les équipes CFCIM, pas d'infra à maintenir, vues/filtres intégrés. |
| Dataset | **Excel (.xlsx)** | CSV, base SQL | Format livré par la CFCIM, manipulable par les analystes. |
| Emails | **SMTP + nodemailer** | SendGrid, Brevo | Pas de vendor lock-in, compatible avec le MTA existant CFCIM. |
| Infra | **Docker Compose** | Kubernetes | Déploiement simple sur un VPS, suffisant pour la volumétrie (<10k membres). |

## Bibliothèques Node

- `@anthropic-ai/sdk` — client officiel Claude
- `rss-parser` — parsing flux RSS robuste
- `xlsx` — lecture `.xlsx` CFCIM
- `nodemailer` — envoi SMTP
- `dotenv` — gestion des secrets

## Modèle Claude recommandé

Tout usage actuel : `claude-sonnet-4-6`.

Pour évoluer :
- **Opus 4.7** (`claude-opus-4-7`) : analyses stratégiques, rapports trimestriels
- **Haiku 4.5** (`claude-haiku-4-5-20251001`) : batch de classification en masse si volumétrie > 10k articles/jour

## Prompt caching

Les prompts système (classification, recommandation) sont stables → activer le **prompt caching** Anthropic pour économiser ~80% de tokens entrants. À ajouter dans une itération ultérieure avec `cache_control: { type: "ephemeral" }` sur le bloc système.
