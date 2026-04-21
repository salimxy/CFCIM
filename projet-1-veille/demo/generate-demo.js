/**
 * Générateur de démo — crée 12 articles fictifs réalistes couvrant les 5 filières CFCIM
 * et génère demo/exemple-output.html sans appel API.
 *
 * Usage : node demo/generate-demo.js
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateEmail } from "../src/generate-email.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Articles fictifs mais réalistes — exportés pour que index.js --demo puisse les importer
export const DEMO_ARTICLES = [
  {
    titre: "Le Maroc accélère la construction du Grand Stade de Casablanca",
    lien: "https://example.com/grand-stade-casablanca",
    date: new Date().toISOString(),
    source: "L'Économiste",
    categorie: "presse-ma",
    contenu: "Les travaux du nouveau stade d'une capacité de 115 000 places s'accélèrent en vue de la Coupe du Monde 2030.",
    filiere_cfcim: "Industrie & Infrastructures",
    pertinence: 5,
    resume: "Construction du Grand Stade de Casablanca à 115 000 places, livraison prévue en 2028. Appels d'offres en cours pour les lots de second œuvre.",
    implications: "Opportunités de marchés pour les entreprises françaises du BTP, de l'ingénierie et des équipements sportifs.",
    coupe_du_monde_2030: true,
    mots_cles: ["BTP", "infrastructures", "CDM2030"],
  },
  {
    titre: "Renault investit 2 Mrd€ dans son usine de Tanger pour les véhicules électriques",
    lien: "https://example.com/renault-tanger-electrique",
    date: new Date().toISOString(),
    source: "Médias24",
    categorie: "presse-ma",
    contenu: "Le groupe français annonce un investissement massif dans sa plateforme tangéroise pour produire les futurs modèles électriques destinés à l'Europe.",
    filiere_cfcim: "Industrie & Infrastructures",
    pertinence: 5,
    resume: "Renault double sa mise à Tanger avec 2 Mrd€ pour reconvertir la production vers l'électrique. 3 500 emplois directs créés d'ici 2027.",
    implications: "Chaîne de sous-traitance marocaine à renforcer : pièces EV, câblage, batteries. Fort potentiel pour équipementiers franco-marocains.",
    coupe_du_monde_2030: false,
    mots_cles: ["automobile", "électrique", "investissement"],
  },
  {
    titre: "La filière agrotech marocaine séduit les PME françaises du Grand Ouest",
    lien: "https://example.com/agrotech-maroc-france",
    date: new Date().toISOString(),
    source: "La Vie Éco",
    categorie: "presse-ma",
    contenu: "Une délégation de 22 entreprises bretonnes et normandes s'est rendue à Agadir pour explorer les partenariats dans l'agriculture de précision.",
    filiere_cfcim: "Agrotech",
    pertinence: 4,
    resume: "22 PME françaises du Grand Ouest en visite à Agadir pour des partenariats en agriculture de précision. Signature de 6 protocoles d'intention.",
    implications: "La CFCIM peut jouer le rôle de facilitateur pour les prochaines missions de prospection franco-marocaines en agrotech.",
    coupe_du_monde_2030: false,
    mots_cles: ["agrotech", "PME", "partenariat"],
  },
  {
    titre: "Les exportations agroalimentaires marocaines vers la France en hausse de 12 %",
    lien: "https://example.com/export-agro-maroc-france",
    date: new Date().toISOString(),
    source: "Hespress Économie",
    categorie: "presse-ma",
    contenu: "Tomates, agrumes et huile d'olive : les expéditions marocaines vers l'Hexagone ont progressé de 12 % en valeur sur le premier semestre.",
    filiere_cfcim: "Agrotech",
    pertinence: 4,
    resume: "Les exportations agroalimentaires marocaines vers la France progressent de 12 % au S1 2026, tirées par les primeurs et l'huile d'olive.",
    implications: "Opportunités logistiques et de co-investissement pour les distributeurs français présents au Maroc.",
    coupe_du_monde_2030: false,
    mots_cles: ["exportations", "agroalimentaire", "France-Maroc"],
  },
  {
    titre: "Digital Morocco 2030 : objectif 5 000 startups tech d'ici la fin de la décennie",
    lien: "https://example.com/digital-morocco-2030",
    date: new Date().toISOString(),
    source: "Aujourd'hui le Maroc",
    categorie: "presse-ma",
    contenu: "Le gouvernement marocain dévoile un plan ambitieux pour faire du Maroc un hub numérique africain avec 5 000 startups et 200 000 emplois dans le digital.",
    filiere_cfcim: "Tech & Services",
    pertinence: 4,
    resume: "Le plan Digital Morocco 2030 vise 5 000 startups et 200 000 emplois dans le numérique. Budget public dédié : 8 Mrd MAD sur 5 ans.",
    implications: "Écosystème favorable à l'implantation de scale-ups françaises du numérique et aux partenariats avec les incubateurs marocains.",
    coupe_du_monde_2030: false,
    mots_cles: ["digital", "startups", "tech"],
  },
  {
    titre: "Casablanca Finance City attire 3 nouvelles fintech françaises en 2026",
    lien: "https://example.com/cfc-fintech-francaises",
    date: new Date().toISOString(),
    source: "Le360 Économie",
    categorie: "presse-ma",
    contenu: "Spendesk, Pennylane et Qonto viennent de formaliser leur implantation à CFC pour accéder aux marchés africains depuis le hub financier casablancais.",
    filiere_cfcim: "Tech & Services",
    pertinence: 5,
    resume: "Trois fintechs françaises (Spendesk, Pennylane, Qonto) ouvrent des bureaux à CFC pour servir l'Afrique subsaharienne depuis Casablanca.",
    implications: "Signal fort pour les membres CFCIM de la Tech : CFC reste la porte d'entrée préférentielle vers l'Afrique pour les acteurs français.",
    coupe_du_monde_2030: false,
    mots_cles: ["fintech", "CFC", "Casablanca"],
  },
  {
    titre: "Ouverture de 3 nouveaux hôtels 5 étoiles à Marrakech avant la Coupe du Monde 2030",
    lien: "https://example.com/hotels-marrakech-cdm",
    date: new Date().toISOString(),
    source: "Médias24",
    categorie: "presse-ma",
    contenu: "Accor, Marriott et un fonds qatari annoncent l'ouverture de trois établissements de luxe à Marrakech, représentant 2 500 nouvelles chambres.",
    filiere_cfcim: "Art de vivre & Santé",
    pertinence: 4,
    resume: "Trois hôtels 5 étoiles (Accor, Marriott, fonds qatari) vont ouvrir à Marrakech d'ici 2029. 2 500 chambres supplémentaires pour accueillir les flux CDM.",
    implications: "Opportunités pour les équipementiers hôteliers et les fournisseurs de services (sécurité, IT, restauration) du réseau CFCIM.",
    coupe_du_monde_2030: true,
    mots_cles: ["hôtellerie", "luxe", "CDM2030"],
  },
  {
    titre: "Le tourisme médical au Maroc explose : +40 % de patients internationaux en 2025",
    lien: "https://example.com/tourisme-medical-maroc",
    date: new Date().toISOString(),
    source: "L'Économiste",
    categorie: "presse-ma",
    contenu: "Les cliniques marocaines ont accueilli 420 000 patients étrangers en 2025, dont 35 % en provenance de France, attirés par les tarifs compétitifs et la qualité des soins.",
    filiere_cfcim: "Art de vivre & Santé",
    pertinence: 4,
    resume: "420 000 patients internationaux au Maroc en 2025 (+40 %), dont 35 % de Français. Chirurgie, dentisterie et ophtalmologie en tête.",
    implications: "Marchés porteurs pour les équipements médicaux, la formation de personnel soignant et les partenariats cliniques franco-marocains.",
    coupe_du_monde_2030: false,
    mots_cles: ["santé", "tourisme médical", "cliniques"],
  },
  {
    titre: "Le Maroc mise sur l'hydrogène vert : 10 Mrd$ d'investissements annoncés",
    lien: "https://example.com/hydrogene-vert-maroc",
    date: new Date().toISOString(),
    source: "La Vie Éco",
    categorie: "presse-ma",
    contenu: "Le gouvernement annonce un plan national hydrogène vert avec 10 milliards de dollars d'investissements sur 10 ans, porté par les géants du renouvelable.",
    filiere_cfcim: "Cleantech",
    pertinence: 5,
    resume: "Plan national hydrogène vert : 10 Mrd$ sur 10 ans, 6 GW d'électrolyse cible à horizon 2035. Partenariats avec TotalEnergies et EDF en cours de négociation.",
    implications: "Opportunité majeure pour les entreprises françaises de l'énergie et de l'industrie verte (EPC, équipements, ingénierie).",
    coupe_du_monde_2030: false,
    mots_cles: ["hydrogène", "cleantech", "énergies renouvelables"],
  },
  {
    titre: "Le Maroc premier producteur africain d'énergie solaire",
    lien: "https://example.com/maroc-solaire-afrique",
    date: new Date().toISOString(),
    source: "Aujourd'hui le Maroc",
    categorie: "presse-ma",
    contenu: "Avec 4,2 GW installés, le Maroc dépasse l'Afrique du Sud et devient le premier producteur continental d'énergie solaire en 2025.",
    filiere_cfcim: "Cleantech",
    pertinence: 4,
    resume: "Le Maroc atteint 4,2 GW solaire installés et devient n°1 en Afrique. Objectif 52 % d'énergies renouvelables dans le mix électrique d'ici 2030.",
    implications: "Débouchés pour les installateurs, mainteneurs et fournisseurs de composants solaires du réseau CFCIM.",
    coupe_du_monde_2030: false,
    mots_cles: ["solaire", "renouvelable", "Afrique"],
  },
  {
    titre: "Business France et CFCIM renforcent leur partenariat pour l'accompagnement VIE",
    lien: "https://example.com/business-france-cfcim-vie",
    date: new Date().toISOString(),
    source: "L'Économiste",
    categorie: "presse-ma",
    contenu: "Un nouvel accord-cadre entre Business France et la CFCIM facilitera le placement de Volontaires Internationaux en Entreprise au Maroc à compter de janvier 2027.",
    filiere_cfcim: "Transversal",
    pertinence: 5,
    resume: "Nouvel accord CFCIM–Business France pour simplifier les démarches VIE au Maroc dès 2027. Guichet unique pour les entreprises françaises.",
    implications: "Facilitation directe du recrutement international pour tous les adhérents CFCIM ayant des besoins en VIE.",
    coupe_du_monde_2030: false,
    mots_cles: ["VIE", "Business France", "CFCIM"],
  },
  {
    titre: "Nouvelle ligne ferroviaire Kénitra–Marrakech : appel d'offres international lancé",
    lien: "https://example.com/train-kenitra-marrakech",
    date: new Date().toISOString(),
    source: "Médias24",
    categorie: "presse-ma",
    contenu: "L'ONCF lance l'appel d'offres pour la conception-construction de la ligne à grande vitesse Kénitra–Marrakech (430 km) prévue pour 2029.",
    filiere_cfcim: "Industrie & Infrastructures",
    pertinence: 5,
    resume: "LGV Kénitra–Marrakech (430 km) : appel d'offres lancé, budget estimé à 5,8 Mrd€. Groupements franco-espagnols en position de force.",
    implications: "Marché de 5,8 Mrd€ accessible aux entreprises françaises du ferroviaire (Alstom, Systra, Eiffage) via les appels d'offres ONCF.",
    coupe_du_monde_2030: true,
    mots_cles: ["ferroviaire", "LGV", "infrastructures"],
  },
];

// Génère le fichier HTML de démo si lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const OUTPUT = path.join(__dirname, "exemple-output.html");

  console.log("Génération de la démo...");
  const html = await generateEmail(DEMO_ARTICLES);

  // Écrit directement dans demo/ (pas dans data/)
  await fs.writeFile(OUTPUT, html);
  console.log(`✅ Démo générée : ${OUTPUT}`);
}
