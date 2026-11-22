import { depuisLeMoment, formaterDate } from '../../lib/dates'
import type { TailleEcran } from '../../lib/ecran'
import type { Contact } from './contacts'

/**
 * Fiche Contact (étape D.5) : les onglets, leurs raccourcis et les petites phrases du
 * profil. Règles pures, testées ; l'affichage est dans `src/pages/FicheContact.tsx`.
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
 * origine, à savoir, consentement).
 */
export function ongletsContact(taille: TailleEcran): readonly OngletContact[] {
  return taille === 'ordinateur'
    ? ['activite', 'projets', 'taches', 'biens']
    : ['activite', 'projets', 'taches', 'biens', 'infos']
}

function estOnglet(valeur: string): valeur is OngletContact {
  return valeur in LIBELLES_ONGLETS
}

/**
 * L'onglet à montrer d'après l'adresse (`?onglet=projets`). « Infos » n'existe pas sur grand
 * écran (son contenu est dans le profil) : il mène à « Activité », comme une valeur inconnue.
 */
export function ongletAffiche(demande: string | null, taille: TailleEcran): OngletContact {
  if (demande === null || !estOnglet(demande)) return 'activite'
  return ongletsContact(taille).includes(demande) ? demande : 'activite'
}

/** Ce qu'on lit d'un appui de touche (un `KeyboardEvent` convient). */
export type AppuiFiche = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  /** Dans un champ, la touche écrit : elle ne commande rien. */
  dansUnChamp: boolean
}

export type RaccourciFiche =
  { genre: 'onglet'; rang: number } | { genre: 'suivant' } | { genre: 'precedent' }

/**
 * Les raccourcis de la fiche, hors des champs : 1 à 5 pour les onglets (selon leur nombre),
 * J pour le contact suivant de la liste, K pour le précédent (comme dans une messagerie).
 */
export function raccourciFiche(appui: AppuiFiche): RaccourciFiche | null {
  if (appui.dansUnChamp || appui.ctrlKey || appui.metaKey || appui.altKey) return null
  const touche = appui.key.toLowerCase()
  if (/^[1-5]$/.test(touche)) return { genre: 'onglet', rang: Number(touche) - 1 }
  if (touche === 'j') return { genre: 'suivant' }
  if (touche === 'k') return { genre: 'precedent' }
  return null
}

/** « Fiche créée le 3 mars 2026 · modifiée il y a 2 jours ». */
export function ligneDatesFiche(
  contact: Pick<Contact, 'created_at' | 'updated_at'>,
  aujourdhui: string,
): string {
  const modifiee = depuisLeMoment(contact.updated_at, aujourdhui)
  const creee = `Fiche créée le ${formaterDate(contact.created_at)}`
  return modifiee === '' ? creee : `${creee} · modifiée ${modifiee}`
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
