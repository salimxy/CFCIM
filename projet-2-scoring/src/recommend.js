import "dotenv/config";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

function buildPrompt(alert) {
  const dp = alert.derniere_participation;
  const dpTxt = dp ? `${dp.date} (${dp.type})` : "Aucune";
  const services = alert.services_utilises?.length ? alert.services_utilises.join(", ") : "Aucun";
  return `Tu es responsable de la relation adhérents à la CFCIM.
Cet adhérent est en risque de désengagement :
- Entreprise : ${alert.Entreprise}
- Secteur : ${alert.Secteur}, Filière : ${alert["Filière_CFCIM"]}
- Région : ${alert["Région"]}, Taille : ${alert.Taille}
- CA estimé : ${alert.CA_Estimé_MDH} MDH
- Score : ${alert.Score_Calculé}/100 (tendance : ${alert.tendance})
- Composantes : événements ${alert.composantes.events}/100, email ${alert.composantes.email}/100, services ${alert.composantes.services}/100, digital ${alert.composantes.digital}/100
- Services utilisés : ${services}
- App My CFCIM : ${alert.App_MyCFCIM}
- Dernière participation : ${dpTxt}

1. Analyse les raisons probables du désengagement (2 lignes)
2. Recommande 3 actions concrètes et personnalisées
3. Rédige un email court (5 lignes) d'approche pour le chargé d'affaires

Réponds uniquement en JSON (sans balise markdown) :
{
  "diagnostic": "...",
  "actions": ["action1", "action2", "action3"],
  "email_approche": "..."
}`;
}

function weakestComponent(components) {
  const entries = Object.entries(components);
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

export function buildDemoRecommendation(alert) {
  const weakest = weakestComponent(alert.composantes);
  const diagnosticByWeak = {
    events: `Adhérent absent des événements de la filière ${alert["Filière_CFCIM"]} depuis plusieurs mois, signal fort de détachement du réseau CFCIM.`,
    email: `Faible engagement sur les campagnes email (opt-in ${alert.Email_Optin}), les communications standardisées ne captent plus son attention.`,
    services: `Sous-utilisation de l'offre de services CFCIM (${alert.services_utilises.length}/11) — l'adhérent ne perçoit pas la valeur ajoutée de son adhésion.`,
    digital: `Absence sur les canaux digitaux CFCIM (App MyCFCIM : ${alert.App_MyCFCIM}), aucun point de contact récurrent.`,
    dynamique: `Tendance à la ${alert.tendance} sur le trimestre, le désengagement s'installe dans la durée.`,
  };

  const actionsBank = {
    events: [
      `Inviter personnellement au prochain événement ${alert["Filière_CFCIM"]} en ${alert["Région"]} (appel + email nominatif).`,
      `Proposer une visite d'entreprise au sein de son écosystème ${alert.Secteur} pour réactiver le lien.`,
      `Organiser une rencontre B2B ciblée avec 2-3 adhérents complémentaires de sa filière.`,
    ],
    email: [
      `Resegmenter l'adhérent sur une campagne thématique ${alert.Secteur} avec contenu à forte valeur ajoutée.`,
      `Envoyer un email personnalisé signé par le chargé d'affaires (hors campagne de masse).`,
      `Proposer un rendez-vous de réengagement incluant un diagnostic gratuit des besoins CFCIM.`,
    ],
    services: [
      `Présenter un service CFCIM non utilisé aligné sur son profil (ex : DESK Commerce International, Études de Marché).`,
      `Offrir un accès prioritaire à la Mission Prospection sur un marché cible.`,
      `Inscrire l'adhérent à une Formation Campus gratuite pour le reconnecter à l'écosystème.`,
    ],
    digital: [
      `Accompagner l'onboarding App MyCFCIM lors d'un rendez-vous physique ou visio.`,
      `Activer l'opt-in email en mettant en avant les contenus premium (Magazine Conjoncture, alertes filière).`,
      `Créer un compte sur la plateforme digitale CFCIM et lui envoyer un guide de découverte.`,
    ],
    dynamique: [
      `Appel téléphonique du chargé d'affaires sous 48h pour comprendre le contexte business actuel.`,
      `Proposer un entretien stratégique pour redéfinir les objectifs de l'adhésion CFCIM.`,
      `Mettre en place un plan de réengagement trimestriel avec points de contact réguliers.`,
    ],
  };

  const actions = actionsBank[weakest].slice(0, 3);

  const email =
    `Bonjour,\n` +
    `Je me permets de revenir vers vous au sujet de votre adhésion à la CFCIM. ` +
    `Nous avons identifié que ${alert.Entreprise} pourrait bénéficier d'un accompagnement plus ciblé sur ${alert["Filière_CFCIM"]}. ` +
    `Pourriez-vous nous accorder 20 minutes cette semaine pour échanger sur vos priorités 2026 ? ` +
    `Je reste à votre écoute pour trouver le meilleur créneau.\n` +
    `Cordialement, votre chargé d'affaires CFCIM.`;

  return {
    diagnostic: diagnosticByWeak[weakest],
    actions,
    email_approche: email,
  };
}

function parseClaudeJSON(text) {
  const cleaned = String(text).trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed || typeof parsed !== "object") throw new Error("réponse non-objet");
  if (typeof parsed.diagnostic !== "string") throw new Error("diagnostic manquant");
  if (!Array.isArray(parsed.actions) || parsed.actions.length === 0) throw new Error("actions manquantes");
  if (typeof parsed.email_approche !== "string") throw new Error("email_approche manquant");
  return {
    diagnostic: parsed.diagnostic,
    actions: parsed.actions.slice(0, 3).map(String),
    email_approche: parsed.email_approche,
  };
}

export async function recommend(alert, { demo = false } = {}) {
  if (demo || !process.env.ANTHROPIC_API_KEY) {
    return buildDemoRecommendation(alert);
  }
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: buildPrompt(alert) }],
    });
    const text = res.content?.[0]?.text ?? "";
    return parseClaudeJSON(text);
  } catch (err) {
    console.warn(`[recommend] fallback template pour ${alert.ID_Adherent}: ${err.message}`);
    return buildDemoRecommendation(alert);
  }
}
