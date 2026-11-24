import { formaterDate } from '../../lib/dates'
import type { TailleEcran } from '../../lib/ecran'
import { ongletDemande } from '../../lib/fiche'
import { libelleTemperature, type Contact, type Temperature } from './contacts'

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
