import type { SupabaseClient } from '@supabase/supabase-js'
import { ajouterJours, dateDuJour } from './dates'
import { creer, listerPage, type Creation, type Resultat } from './donnees'
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

/**
 * Ce qui change d'une tâche fictive à l'autre : une par vue de la page Tâches, un rendez-vous
 * avec heure et lieu, une visite liée à un bien, une tâche mensuelle et un créneau de
 * prospection. `jours` : écart avec aujourd'hui ; `lien` : à quoi la tâche est liée.
 */
const MODELES_TACHES: readonly (Omit<Creation<'taches'>, 'echeance'> & {
  jours: number
  lien: 'contact' | 'bien' | 'les_deux' | null
})[] = [
  { titre: 'Rappeler pour le projet de vente', categorie: 'relance', jours: -2, lien: 'contact' },
  {
    titre: 'Rendez-vous de découverte',
    categorie: 'rendez_vous',
    heure: '10:00',
    duree: 60,
    lieu: `12 rue de l'Exemple, ${CODE_POSTAL_FICTIF} ${VILLE_FICTIVE}`,
    priorite: 1,
    jours: 0,
    lien: 'contact',
  },
  {
    titre: 'Envoyer le dossier de diagnostics',
    categorie: 'administratif',
    jours: 0,
    lien: 'bien',
  },
  {
    titre: 'Visite avec un acquéreur',
    categorie: 'visite',
    heure: '17:30',
    duree: 45,
    jours: 1,
    lien: 'les_deux',
  },
  {
    titre: 'Compte rendu au vendeur',
    categorie: 'relance',
    recurrence: 'mois',
    jours: 3,
    lien: 'les_deux',
  },
  {
    titre: 'Prospection : boîtage du quartier',
    categorie: 'prospection',
    heure: '14:00',
    duree: 120,
    lieu: `avenue du Test, ${VILLE_FICTIVE}`,
    recurrence: 'semaine',
    jours: 9,
    lien: null,
  },
]

/** Nombre de tâches du lot fictif. */
export const NOMBRE_TACHES_FICTIVES = MODELES_TACHES.length

/**
 * Fabrique une tâche fictive, datée par rapport à `aujourdhui` et liée, si le modèle le
 * prévoit, au contact et au bien donnés.
 */
export function tacheFictive(
  rang: number,
  aujourdhui: string,
  liens: { contactId: string | null; bienId: string | null },
): Creation<'taches'> {
  const modele = MODELES_TACHES[rang % MODELES_TACHES.length]
  if (modele === undefined) throw new Error('Aucun modèle de tâche fictive.')
  const { jours, lien, ...valeurs } = modele
  const echeance = ajouterJours(aujourdhui, jours)
  return {
    ...valeurs,
    motif: 'Tâche fictive, créée pour les essais.',
    echeance,
    recurrence_ancre:
      valeurs.recurrence === undefined || valeurs.recurrence === null ? null : echeance,
    contact_id: lien === 'contact' || lien === 'les_deux' ? liens.contactId : null,
    bien_id: lien === 'bien' || lien === 'les_deux' ? liens.bienId : null,
  }
}

/** Les fiches fictives les plus récentes, auxquelles se lient tâches et activités. */
async function fichesFictivesRecentes(client: SupabaseClient, nombre: number) {
  const contacts = await listerPage(client, 'contacts', {
    filtres: [{ colonne: 'etiquettes', genre: 'comprend', valeur: ['fictif'] }],
    tri: [{ colonne: 'created_at', croissant: false }, { colonne: 'id' }],
    debut: 0,
    taille: nombre,
  })
  if (!contacts.ok) return contacts
  const biens = await listerPage(client, 'biens', {
    filtres: [{ colonne: 'ville', genre: 'egal', valeur: VILLE_FICTIVE }],
    tri: [{ colonne: 'created_at', croissant: false }, { colonne: 'id' }],
    debut: 0,
    taille: nombre,
  })
  if (!biens.ok) return biens
  const contactsLus = contacts.donnees.lignes
  const biensLus = biens.donnees.lignes
  return {
    ok: true as const,
    donnees: (rang: number) => ({
      contactId: contactsLus[rang % Math.max(contactsLus.length, 1)]?.id ?? null,
      bienId: biensLus[rang % Math.max(biensLus.length, 1)]?.id ?? null,
    }),
  }
}

const JEU_TACHES: JeuFictif = {
  libelle: 'Tâches',
  async inserer(client) {
    // Les tâches se lient aux fiches fictives les plus récentes (celles des lots précédents).
    const fiches = await fichesFictivesRecentes(client, NOMBRE_TACHES_FICTIVES)
    if (!fiches.ok) return fiches
    const aujourdhui = dateDuJour()
    for (let rang = 0; rang < NOMBRE_TACHES_FICTIVES; rang += 1) {
      const resultat = await creer(
        client,
        'taches',
        tacheFictive(rang, aujourdhui, fiches.donnees(rang)),
      )
      if (!resultat.ok) return resultat
    }
    return { ok: true, donnees: NOMBRE_TACHES_FICTIVES }
  },
}

/**
 * Ce qui change d'une activité fictive à l'autre : des appels aux résultats variés, des
 * messages, une visite et une estimation liées à la fois à un contact et à un bien, du
 * porte-à-porte et une note. `jours` : écart (négatif) avec aujourd'hui ; `lien` : à quoi
 * l'activité est liée.
 */
const MODELES_ACTIVITES: readonly (Omit<Creation<'activites'>, 'date_activite'> & {
  jours: number
  lien: 'contact' | 'bien' | 'les_deux' | null
})[] = [
  {
    type: 'appel',
    resultat: 'joint',
    heure: '09:15',
    duree: 10,
    compte_rendu: 'Appel fictif : projet de vente au printemps, estimation à prévoir.',
    jours: 0,
    lien: 'contact',
  },
  {
    type: 'sms',
    heure: '08:40',
    compte_rendu: 'SMS fictif : confirmation du rendez-vous de demain.',
    jours: 0,
    lien: 'contact',
  },
  {
    type: 'appel',
    resultat: 'messagerie',
    heure: '17:50',
    compte_rendu: '',
    jours: -1,
    lien: 'contact',
  },
  {
    type: 'visite',
    heure: '11:00',
    duree: 45,
    compte_rendu: 'Visite fictive : acquéreurs intéressés, craignent les travaux de toiture.',
    jours: -2,
    lien: 'les_deux',
  },
  {
    type: 'estimation',
    heure: '14:30',
    duree: 60,
    compte_rendu: 'Estimation fictive : fourchette donnée oralement, avis de valeur à envoyer.',
    jours: -5,
    lien: 'les_deux',
  },
  {
    type: 'courriel',
    heure: '10:05',
    compte_rendu: 'Courriel fictif : envoi des diagnostics demandés.',
    jours: -8,
    lien: 'contact',
  },
  {
    type: 'porte_a_porte',
    heure: '16:00',
    duree: 90,
    compte_rendu: 'Porte-à-porte fictif, avenue du Test : 25 portes, 3 contacts, 1 projet.',
    jours: -12,
    lien: null,
  },
  {
    type: 'note',
    heure: '19:00',
    compte_rendu: 'Note fictive : le bien est mitoyen côté jardin.',
    jours: -20,
    lien: 'bien',
  },
]

/** Nombre d'activités du lot fictif. */
export const NOMBRE_ACTIVITES_FICTIVES = MODELES_ACTIVITES.length

/**
 * Fabrique une activité fictive, datée par rapport à `aujourdhui` (jamais après) et liée,
 * si le modèle le prévoit, au contact et au bien donnés.
 */
export function activiteFictive(
  rang: number,
  aujourdhui: string,
  liens: { contactId: string | null; bienId: string | null },
): Creation<'activites'> {
  const modele = MODELES_ACTIVITES[rang % MODELES_ACTIVITES.length]
  if (modele === undefined) throw new Error('Aucun modèle d’activité fictive.')
  const { jours, lien, ...valeurs } = modele
  return {
    ...valeurs,
    date_activite: ajouterJours(aujourdhui, jours),
    contact_id: lien === 'contact' || lien === 'les_deux' ? liens.contactId : null,
    bien_id: lien === 'bien' || lien === 'les_deux' ? liens.bienId : null,
  }
}

const JEU_ACTIVITES: JeuFictif = {
  libelle: 'Journal',
  async inserer(client) {
    const fiches = await fichesFictivesRecentes(client, NOMBRE_ACTIVITES_FICTIVES)
    if (!fiches.ok) return fiches
    const aujourdhui = dateDuJour()
    for (let rang = 0; rang < NOMBRE_ACTIVITES_FICTIVES; rang += 1) {
      const resultat = await creer(
        client,
        'activites',
        activiteFictive(rang, aujourdhui, fiches.donnees(rang)),
      )
      if (!resultat.ok) return resultat
    }
    return { ok: true, donnees: NOMBRE_ACTIVITES_FICTIVES }
  },
}

/**
 * Ce qui change d'un projet vendeur fictif à l'autre : un projet à chacune des quatre
 * premières étapes, avec les informations que demande l'étape. Les deux premiers sont du
 * même vendeur (deux biens). `jours` : depuis combien de jours le projet est dans l'étape.
 */
const MODELES_PROJETS_VENDEURS: readonly (Omit<
  Creation<'projets_vendeurs'>,
  'contact_id' | 'bien_id'
> & { jours: number; contact: number; bien: number })[] = [
  { etape: 'premier_contact', jours: 2, contact: 0, bien: 0, notes: 'Projet fictif.' },
  {
    etape: 'decouverte',
    jours: 9,
    contact: 0,
    bien: 1,
    prix_espere: 350000,
    notes: 'Projet fictif : second bien du même vendeur.',
  },
  {
    etape: 'estimation',
    jours: 40,
    contact: 1,
    bien: 2,
    motif_vente: 'Mutation fictive',
    echeance_souhaitee: '2027-06-30',
    prix_espere: 140000,
    agences_consultees: 'Agence fictive du Centre',
  },
  {
    etape: 'suivi',
    jours: 12,
    contact: 2,
    bien: 3,
    motif_vente: 'Agrandissement fictif',
    echeance_souhaitee: '2027-03-31',
    prix_espere: 210000,
    estimation_basse: 185000,
    estimation_haute: 200000,
    notes: 'Objection fictive : trouve l’estimation basse.',
  },
]

/** Nombre de projets vendeurs du lot fictif. */
export const NOMBRE_PROJETS_VENDEURS_FICTIFS = MODELES_PROJETS_VENDEURS.length

/** Fabrique un projet vendeur fictif, lié au contact et au bien donnés. */
export function projetVendeurFictif(
  rang: number,
  aujourdhui: string,
  liens: { contactId: string; bienId: string },
): Creation<'projets_vendeurs'> {
  const modele = MODELES_PROJETS_VENDEURS[rang % MODELES_PROJETS_VENDEURS.length]
  if (modele === undefined) throw new Error('Aucun modèle de projet fictif.')
  const valeurs: Creation<'projets_vendeurs'> = { ...modele, contact_id: '', bien_id: '' }
  delete (valeurs as Partial<typeof modele>).jours
  delete (valeurs as Partial<typeof modele>).contact
  delete (valeurs as Partial<typeof modele>).bien
  const jours = modele.jours
  const avecAvis = valeurs.etape === 'suivi'
  return {
    ...valeurs,
    etape_le: ajouterJours(aujourdhui, -jours),
    ...(avecAvis
      ? {
          estimation_le: ajouterJours(aujourdhui, -20),
          avis_remis_le: ajouterJours(aujourdhui, -jours),
        }
      : {}),
    contact_id: liens.contactId,
    bien_id: liens.bienId,
  }
}

const JEU_PROJETS_VENDEURS: JeuFictif = {
  libelle: 'Projets vendeurs',
  async inserer(client) {
    // Les projets portent sur les biens fictifs les plus récents (ceux du lot Biens) :
    // un bien n'a qu'un projet en cours à la fois.
    const fiches = await fichesFictivesRecentes(client, NOMBRE_BIENS_FICTIFS)
    if (!fiches.ok) return fiches
    const aujourdhui = dateDuJour()
    for (let rang = 0; rang < NOMBRE_PROJETS_VENDEURS_FICTIFS; rang += 1) {
      const modele = MODELES_PROJETS_VENDEURS[rang]
      const contactId = fiches.donnees(modele?.contact ?? 0).contactId
      const bienId = fiches.donnees(modele?.bien ?? 0).bienId
      if (contactId === null || bienId === null) {
        return { ok: true, donnees: rang }
      }
      const projet = await creer(
        client,
        'projets_vendeurs',
        projetVendeurFictif(rang, aujourdhui, { contactId, bienId }),
      )
      if (!projet.ok) return projet
      // Une prochaine action liée au projet, sauf pour le premier : la carte l'annonce.
      if (rang > 0) {
        const tache = await creer(client, 'taches', {
          titre: 'Relancer le vendeur (fictif)',
          categorie: 'relance',
          echeance: ajouterJours(aujourdhui, rang * 3),
          motif: 'Tâche fictive liée au projet.',
          contact_id: contactId,
          bien_id: bienId,
          projet_vendeur_id: projet.donnees.id,
        })
        if (!tache.ok) return tache
      }
    }
    return { ok: true, donnees: NOMBRE_PROJETS_VENDEURS_FICTIFS }
  },
}

/** Les lots disponibles. Chaque étape qui crée une table y ajoute le sien. */
export const JEUX_FICTIFS: readonly JeuFictif[] = [
  JEU_CONTACTS,
  JEU_BIENS,
  JEU_TACHES,
  JEU_ACTIVITES,
  JEU_PROJETS_VENDEURS,
]

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
