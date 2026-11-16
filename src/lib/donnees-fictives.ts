import type { SupabaseClient } from '@supabase/supabase-js'
import { creer, type Creation, type Resultat } from './donnees'
import type { Environnement } from './environnement'

/**
 * Données fictives pour le projet de test. Tout est inventé et reconnaissable au premier
 * coup d'œil : noms de famille factices, ville et code postal inexistants, numéros de
 * téléphone pris dans les tranches réservées aux fictions, courriels en « .invalid ».
 */

export type PersonneFictive = {
  prenom: string
  nom: string
  telephone: string
  courriel: string
  adresse: string
  codePostal: string
  ville: string
}

const PRENOMS = ['Camille', 'Dominique', 'Claude', 'Sacha', 'Alix', 'Maxence', 'Lou', 'Morgan']
const NOMS = ['Fictif', 'Exemple', 'Factice', 'Inventé', 'Spécimen', 'Postiche', 'Imaginaire']
const VOIES = [
  "rue de l'Exemple",
  'avenue du Test',
  'impasse Fictive',
  'place de la Démonstration',
  'chemin des Essais',
]

/** Ville et code postal qui n'existent pas. */
export const VILLE_FICTIVE = 'Villefictive'
export const CODE_POSTAL_FICTIF = '00000'

function choisir(liste: readonly string[], rang: number): string {
  return liste[rang % liste.length] ?? ''
}

/** Retire accents et majuscules, pour fabriquer une adresse de courriel. */
function simplifier(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Numéro de portable fictif : la tranche 06 39 98 est réservée aux œuvres de fiction,
 * aucun abonné ne peut la recevoir.
 */
export function telephoneFictif(rang: number): string {
  const fin = String(rang % 10000).padStart(4, '0')
  return `06 39 98 ${fin.slice(0, 2)} ${fin.slice(2)}`
}

/** Fabrique une personne fictive. Le même rang donne toujours la même personne. */
export function personneFictive(rang: number): PersonneFictive {
  const prenom = choisir(PRENOMS, rang)
  // Décalage pour que prénoms et noms ne tournent pas au même rythme.
  const nom = choisir(NOMS, rang + Math.floor(rang / PRENOMS.length))
  return {
    prenom,
    nom,
    telephone: telephoneFictif(rang),
    // Le domaine « .invalid » est réservé : aucun courriel ne peut y arriver.
    courriel: `${simplifier(prenom)}.${simplifier(nom)}${rang}@exemple.invalid`,
    adresse: `${(rang % 98) + 1} ${choisir(VOIES, rang)}`,
    codePostal: CODE_POSTAL_FICTIF,
    ville: VILLE_FICTIVE,
  }
}

/** Fabrique `nombre` personnes fictives, toujours les mêmes. */
export function personnesFictives(nombre: number): PersonneFictive[] {
  return Array.from({ length: nombre }, (_, rang) => personneFictive(rang))
}

/** Un lot de données fictives pour un domaine (contacts, biens…), ajouté à l'étape qui le crée. */
export type JeuFictif = {
  libelle: string
  /** Insère le lot et renvoie le nombre de lignes créées. */
  inserer: (client: SupabaseClient) => Promise<Resultat<number>>
}

const ROLES_FICTIFS = [['vendeur'], ['acquereur'], ['vendeur', 'acquereur'], ['prescripteur'], []]
const SOURCES_FICTIVES = [
  { source: 'pige', detail: 'Annonce fictive, maison 4 pièces' },
  { source: 'porte_a_porte', detail: "Rencontre fictive, rue de l'Exemple" },
  { source: 'boitage', detail: 'Retour fictif du boitage de printemps' },
  { source: 'demande_entrante', detail: 'Demande fictive depuis un portail' },
  { source: 'reseaux_sociaux_site', detail: 'Message fictif après une publication' },
  { source: 'sphere_personnelle', detail: 'Ancien client fictif' },
]
const TEMPERATURES_FICTIVES = ['chaud', 'tiede', 'froid', 'veille']
const ETIQUETTES_FICTIVES = [
  ['investisseur'],
  [],
  ['résidence secondaire', 'retraité'],
  ['primo-accédant'],
]

/**
 * Situations de consentement, pour essayer le blocage de l'appel : accord inconnu (appel
 * bloqué), accord prouvé, client existant sans accord, refus, opposition au démarchage.
 */
const CONSENTEMENTS_FICTIFS: readonly Partial<Creation<'contacts'>>[] = [
  {},
  {
    accord_appel: 'oui',
    accord_appel_date: '2026-09-15',
    accord_appel_preuve: 'Accord fictif, donné de vive voix lors d’une estimation inventée',
  },
  { client_existant: true },
  { accord_appel: 'non', accord_appel_date: '2026-10-01' },
  {
    accord_appel: 'oui',
    accord_appel_date: '2026-06-20',
    accord_appel_preuve: 'Case fictive cochée sur un formulaire de démonstration',
  },
  { opposition_demarchage: true, opposition_demarchage_date: '2026-10-20' },
]

/** Nombre de contacts du lot fictif. */
export const NOMBRE_CONTACTS_FICTIFS = 12

/**
 * Fabrique un contact fictif, prêt à être enregistré. Un sur six est une société
 * (une étude de notaire inventée) ; les autres sont des personnes.
 */
export function contactFictif(rang: number): Creation<'contacts'> {
  const personne = personneFictive(rang)
  const origine = SOURCES_FICTIVES[rang % SOURCES_FICTIVES.length]
  const societe = rang % 6 === 5
  return {
    type: societe ? 'societe' : 'personne',
    civilite: rang % 2 === 0 ? 'mme' : 'm',
    prenom: personne.prenom,
    nom: personne.nom,
    raison_sociale: societe ? `Étude ${personne.nom} et associés` : '',
    // Format d'enregistrement : international, sans espace.
    telephones: [`+33${personne.telephone.replace(/\s/g, '').slice(1)}`],
    courriels: [personne.courriel],
    adresse: personne.adresse,
    code_postal: personne.codePostal,
    ville: personne.ville,
    notes: 'Fiche fictive, créée pour les essais.',
    roles: societe ? ['notaire'] : (ROLES_FICTIFS[rang % ROLES_FICTIFS.length] ?? []),
    etiquettes: ['fictif', ...(ETIQUETTES_FICTIVES[rang % ETIQUETTES_FICTIVES.length] ?? [])],
    source: origine?.source ?? null,
    source_detail: origine?.detail ?? '',
    temperature: TEMPERATURES_FICTIVES[rang % TEMPERATURES_FICTIVES.length] ?? null,
    collecte_origine: 'Coordonnées fictives, inventées pour les essais',
    collecte_date: '2026-05-04',
    // Décalé d'un cran par rapport aux sociétés, pour que chaque situation tombe sur une personne.
    ...CONSENTEMENTS_FICTIFS[(rang + Math.floor(rang / 6)) % CONSENTEMENTS_FICTIFS.length],
  }
}

const JEU_CONTACTS: JeuFictif = {
  libelle: 'Contacts',
  async inserer(client) {
    for (let rang = 0; rang < NOMBRE_CONTACTS_FICTIFS; rang += 1) {
      const resultat = await creer(client, 'contacts', contactFictif(rang))
      if (!resultat.ok) return resultat
    }
    return { ok: true, donnees: NOMBRE_CONTACTS_FICTIFS }
  },
}

/** Ce qui change d'un bien fictif à l'autre : un exemple de chaque type, à des statuts variés. */
const MODELES_BIENS: readonly Partial<Creation<'biens'>>[] = [
  {
    type: 'ancien',
    statut: 'en_mandat',
    prix: 285000,
    etage: 2,
    surface: 72.5,
    pieces: 3,
    chambres: 2,
    annee_construction: 1974,
    etat: 'bon',
    dpe_classe: 'D',
    dpe_valeur: 210,
    dpe_date: '2026-03-12',
    ges_classe: 'D',
    ges_valeur: 42,
    ges_date: '2026-03-12',
    copropriete: true,
    charges_annuelles: 1800,
    taxe_fonciere: 950,
  },
  {
    type: 'neuf',
    statut: 'en_veille',
    prix: 340000,
    surface: 64,
    pieces: 3,
    chambres: 2,
    programme: 'Résidence fictive Les Essais',
    lot: 'B204',
    date_livraison: '2027-09-30',
  },
  {
    type: 'viager',
    statut: 'en_estimation',
    prix: 120000,
    surface: 95,
    pieces: 4,
    chambres: 3,
    annee_construction: 1962,
    etat: 'a_rafraichir',
    viager_bouquet: 60000,
    viager_rente: 750,
    viager_occupation: 'occupe',
    viager_ages: [82, 79],
  },
  {
    type: 'commerce',
    statut: 'repere',
    prix: 195000,
    etage: 0,
    surface: 110,
    commerce_nature: 'murs_et_fonds',
    commerce_bail: 'Bail commercial fictif 3-6-9, échéance en 2029',
    commerce_loyer: 14400,
    commerce_activite: 'Boulangerie de démonstration',
  },
  {
    type: 'terrain',
    statut: 'sous_offre',
    prix: 89000,
    surface_terrain: 640,
    constructible: true,
    viabilise: false,
  },
  { type: 'ancien', statut: 'vendu', prix: 410000, surface: 128, pieces: 6, chambres: 4 },
]

/** Nombre de biens du lot fictif : au moins un de chaque type. */
export const NOMBRE_BIENS_FICTIFS = MODELES_BIENS.length

/** Fabrique un bien fictif, prêt à être enregistré : adresse inventée, ville inexistante. */
export function bienFictif(rang: number): Creation<'biens'> {
  return {
    adresse: `${(rang % 98) + 1} ${choisir(VOIES, rang)}`,
    code_postal: CODE_POSTAL_FICTIF,
    ville: VILLE_FICTIVE,
    description: 'Bien fictif, créé pour les essais.',
    type: 'ancien',
    ...MODELES_BIENS[rang % MODELES_BIENS.length],
  }
}

const JEU_BIENS: JeuFictif = {
  libelle: 'Biens',
  async inserer(client) {
    for (let rang = 0; rang < NOMBRE_BIENS_FICTIFS; rang += 1) {
      const resultat = await creer(client, 'biens', bienFictif(rang))
      if (!resultat.ok) return resultat
    }
    return { ok: true, donnees: NOMBRE_BIENS_FICTIFS }
  },
}

/** Les lots disponibles. Chaque étape qui crée une table y ajoute le sien. */
export const JEUX_FICTIFS: readonly JeuFictif[] = [JEU_CONTACTS, JEU_BIENS]

export type BilanFictif = { ok: true; lignes: number } | { ok: false; message: string }

/**
 * Insère les lots de données fictives. Refuse d'agir ailleurs que sur le projet de test :
 * c'est le seul passage par lequel des données fictives entrent dans la base.
 */
export async function insererDonneesFictives(
  client: SupabaseClient,
  environnement: Environnement,
  jeux: readonly JeuFictif[] = JEUX_FICTIFS,
): Promise<BilanFictif> {
  if (environnement !== 'test') {
    return {
      ok: false,
      message: 'Les données fictives ne peuvent être ajoutées que sur le projet de test.',
    }
  }
  let lignes = 0
  for (const jeu of jeux) {
    const resultat = await jeu.inserer(client)
    if (!resultat.ok) {
      return { ok: false, message: `${jeu.libelle} : ${resultat.erreur.message}` }
    }
    lignes += resultat.donnees
  }
  return { ok: true, lignes }
}
