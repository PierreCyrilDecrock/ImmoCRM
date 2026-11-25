import { depuisQuand, ecartJours, formaterDate } from '../../lib/dates'
import type { TailleEcran } from '../../lib/ecran'
import { ongletDemande } from '../../lib/fiche'
import { libelleTypeActivite, type Activite } from '../activites/activites'
import { libelleTemperature, type Contact, type Temperature } from './contacts'
import { ilYaCourt } from './jamais-contactes'

/**
 * Fiche Contact (étape D.5) : les onglets et les petites phrases du profil. Règles pures, testées ; l'affichage est dans `src/pages/FicheContact.tsx`.
 */

export type OngletContact = 'activite' | 'projets' | 'taches' | 'biens' | 'infos'

export const LIBELLES_ONGLETS: Record<OngletContact, string> = {
  activite: 'Activité',
  projets: 'Projets',
  taches: 'Tâches',
  biens: 'Biens',
  infos: 'Infos',
}

/**
 * Les onglets, dans l'ordre : les mêmes partout, Activité, Projets, Tâches, Biens. Quand le
 * profil n'a pas sa colonne (écran de moins de 1024 px : téléphone, tablette en hauteur), un
 * cinquième onglet, « Infos », porte ce que le profil montre sur grand écran (coordonnées,
 * origine, à savoir, consentement). Il vient juste après Activité (étape E.7) : au téléphone,
 * les cinq onglets ne tiennent pas sur la largeur, et les coordonnées doivent se voir sans
 * faire défiler les onglets ; c'est Biens, le moins consulté, qui passe sous le fondu.
 */
export function ongletsContact(taille: TailleEcran): readonly OngletContact[] {
  return taille === 'ordinateur'
    ? ['activite', 'projets', 'taches', 'biens']
    : ['activite', 'infos', 'projets', 'taches', 'biens']
}

/**
 * L'onglet à montrer d'après l'adresse (`?onglet=projets`). « Infos » n'existe pas sur grand
 * écran (son contenu est dans le profil) : il mène à « Activité », comme une valeur inconnue.
 */
export function ongletAffiche(demande: string | null, taille: TailleEcran): OngletContact {
  return ongletDemande(demande, ongletsContact(taille))
}

/** La ligne verte du profil quand l'appel est permis : « Accepte d'être appelé depuis le … ». */
export function ligneAccord(contact: Pick<Contact, 'accord_appel_date'>): string {
  const date = formaterDate(contact.accord_appel_date)
  return date === '' ? 'Accepte d’être appelé' : `Accepte d’être appelé depuis le ${date}`
}

/** Les températures de la commande segmentée : un contact « en veille » n'en a aucune d'allumée. */
export const TEMPERATURES_FICHE = [
  { valeur: 'froid', libelle: 'Froid' },
  { valeur: 'tiede', libelle: 'Tiède' },
  { valeur: 'chaud', libelle: 'Chaud' },
] as const

/** Une couleur par température : chaud en rouge, tiède en ambre, froid en bleu, veille en gris. */
export const COULEURS_TEMPERATURE: Record<Temperature, string> = {
  chaud: 'bg-danger',
  tiede: 'bg-alerte',
  froid: 'bg-accent',
  veille: 'bg-bord-fort',
}

/**
 * La puce de température de l'en-tête de la fiche, sur téléphone et tablette (étape E.6) :
 * « ● Chaud », « ● En veille », ou « ○ Température » quand rien n'est renseigné (un rond
 * vide, `couleur` à `null`). Le texte est toujours écrit : la couleur ne le dit jamais seule.
 */
export function puceTemperatureFiche(temperature: Temperature | null): {
  texte: string
  couleur: string | null
  /** Ce que lit un lecteur d'écran sur le bouton. */
  annonce: string
} {
  if (temperature === null) {
    return { texte: 'Température', couleur: null, annonce: 'Température non renseignée, choisir' }
  }
  const texte = temperature === 'veille' ? 'En veille' : (libelleTemperature(temperature) ?? '')
  return {
    texte,
    couleur: COULEURS_TEMPERATURE[temperature],
    annonce: `Température : ${texte.toLowerCase()}, changer`,
  }
}

// ---------------------------------------------------------------------------
// En-tête : le dernier échange (revue de design n° 2, proposition 14)
// ---------------------------------------------------------------------------

/** Ce qu'a été le dernier échange, en deux ou trois mots : « Appel joint », « Visite ». */
const APPELS: Record<string, string> = {
  joint: 'Appel joint',
  messagerie: 'Appel en messagerie',
  pas_de_reponse: 'Appel sans réponse',
  rappeler: 'Appel, à rappeler',
}

function quoiDernierEchange(activite: Pick<Activite, 'type' | 'resultat'>): string {
  if (activite.type === 'appel') return APPELS[activite.resultat ?? ''] ?? 'Appel'
  if (activite.type === 'autre') return 'Échange'
  return libelleTypeActivite(activite.type)
}

const INSECABLE = '\u00a0'

/**
 * Le dernier échange, en une ligne courte sous le nom : « Appel joint · il y a 7 j »,
 * « Visite · hier » ; « Jamais contacté » sans aucun échange (à n'appeler qu'avec une lecture
 * réussie). Le point reste collé à ce qui le précède et l'ancienneté ne se coupe pas : si la
 * ligne doit se couper, aucune ne commence par un point. `annonce` est la phrase entière, pour
 * les lecteurs d'écran (« Dernier échange : appel joint, il y a 7 jours »).
 */
export function dernierEchangeCourt(
  activite: Pick<Activite, 'type' | 'resultat' | 'date_activite'> | null,
  aujourdhui: string,
): { texte: string; annonce: string } {
  if (activite === null) return { texte: 'Jamais contacté', annonce: 'Jamais contacté' }
  const jours = Math.max(0, ecartJours(activite.date_activite, aujourdhui))
  const quoi = quoiDernierEchange(activite)
  const quand = ilYaCourt(jours).replaceAll(' ', INSECABLE)
  return {
    texte: `${quoi}${INSECABLE}· ${quand}`,
    annonce: `Dernier échange : ${quoi.toLocaleLowerCase('fr')}, ${depuisQuand(jours)}`,
  }
}
