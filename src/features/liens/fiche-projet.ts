import type { GenreEtiquette } from '../../components/Etiquette'
import { ecartJours, formaterDate, formaterJourSemaine } from '../../lib/dates'
import { nomComplet, type Contact } from '../contacts/contacts'
import type { VideTaches } from '../taches/a-venir'
import type { GenreProjet } from './lien-projet'

/**
 * Fiches Projet de vente et Projet d'achat (étape D.7) : leurs onglets, sur le modèle de la
 * fiche Contact. La deuxième place revient, comme sur les fiches Contact et Bien, à ce qui
 * est lié au projet : les biens proposés d'un projet d'achat.
 */

export type OngletProjet = 'activite' | 'biens' | 'taches' | 'details'

export const LIBELLES_ONGLETS_PROJET: Record<OngletProjet, string> = {
  activite: 'Activité',
  biens: 'Biens proposés',
  taches: 'Tâches',
  details: 'Détails',
}

/** Les mêmes onglets sur tous les écrans ; « Biens proposés » pour un projet d'achat. */
export function ongletsProjet(genre: GenreProjet): readonly OngletProjet[] {
  return genre === 'acquereur'
    ? ['activite', 'biens', 'taches', 'details']
    : ['activite', 'taches', 'details']
}

/** Le haut d'une fiche projet : une ligne au-dessus du titre (type et contact), et le titre. */
export type EnTeteProjet = { surtitre: string; titre: string }

/**
 * Projet de vente : le bien en titre, « Projet de vente · Camille Fictif » au-dessus. Sans
 * bien, le vendeur passe en titre (il n'est pas écrit deux fois).
 */
export function enTeteProjetVendeur(bien: string | null, vendeur: string | null): EnTeteProjet {
  if (bien === null) {
    return { surtitre: 'Projet de vente', titre: vendeur ?? 'Projet de vente' }
  }
  return {
    surtitre: vendeur === null ? 'Projet de vente' : `Projet de vente · ${vendeur}`,
    titre: bien,
  }
}

/**
 * Projet d'achat : l'acquéreur en titre, « Projet d'achat » au-dessus, avec le co-acquéreur
 * s'il y en a un (« Projet d'achat · avec Dominique Essai »).
 */
export function enTeteProjetAcquereur(
  acquereur: string | null,
  coAcquereur: string | null,
): EnTeteProjet {
  return {
    surtitre: coAcquereur === null ? 'Projet d’achat' : `Projet d’achat · avec ${coAcquereur}`,
    titre: acquereur ?? 'Projet d’achat',
  }
}

/**
 * La pastille d'état, à côté du type de projet. Rien pour un projet en cours : son étape est
 * dans la frise, et nulle part ailleurs. Un projet hors du pipeline garde son état visible
 * (« À recontacter le … », « Perdu ») ; un projet gagné dit quand (`gagne` : « Mandat exclusif
 * signé le … », « Offre acceptée le … »).
 */
export function pastilleEtatProjet(projet: {
  etat: string
  archive: boolean
  recontacterLe: string | null
  gagne: string
}): { genre: GenreEtiquette; texte: string } | null {
  if (projet.archive) return { genre: 'neutre', texte: 'Archivé' }
  switch (projet.etat) {
    case 'a_recontacter':
      return {
        genre: 'alerte',
        texte:
          projet.recontacterLe === null
            ? 'À recontacter'
            : `À recontacter le ${formaterDate(projet.recontacterLe)}`,
      }
    case 'perdu':
      return { genre: 'neutre', texte: 'Perdu' }
    case 'gagne':
      return { genre: 'succes', texte: projet.gagne }
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Rien de prévu pour ce projet (revue n° 2, proposition 6, règle 10)
// ---------------------------------------------------------------------------

/** Le geste unique pour créer une tâche depuis une fiche Projet (liée au projet et au contact). */
export const PLANIFIER_PROJET = 'Planifier pour ce projet'

/** La carte orange : un projet en cours dont le contact n'a rien de prévu, nulle part. */
export const ALERTE_PROJET = 'Aucune action prévue pour ce projet'

/** L'onglet Tâches quand la carte orange est au-dessus : il ne répète pas l'absence. */
export const TACHES_A_VENIR_PROJET = 'Les tâches liées à ce projet s’afficheront ici.'

/** La prochaine action du contact du projet, prévue ailleurs (un autre projet, sa fiche). */
export type ActionAilleurs = {
  /** Le prénom du contact (« Camille »), ou son nom s'il n'a pas de prénom. */
  qui: string
  echeance: string
  titre: string
}

/** Comment la fiche dit qu'il n'y a rien de prévu, ou qu'il y a quelque chose. */
export type SuiteProjet =
  | { forme: 'chargement' }
  /** Le projet a une tâche à faire : la carte « Prochaine action » la montre. */
  | { forme: 'tache' }
  /** Projet en cours, contact sans aucune action : la carte orange, un risque de perte. */
  | { forme: 'alerte' }
  /** Rien pour ce projet, mais pas d'alerte : une phrase grise dans « À venir ». */
  | { forme: 'phrase'; phrase: string }

/** Le jour d'une action dans une phrase : « aujourd'hui », « demain », « jeudi 26 nov. ». */
function quand(echeance: string, aujourdhui: string): string {
  const ecart = ecartJours(aujourdhui, echeance)
  if (ecart === 0) return 'aujourd’hui'
  if (ecart === 1) return 'demain'
  if (ecart < 0) return `en retard, prévue ${formaterJourSemaine(echeance, aujourdhui)}`
  return formaterJourSemaine(echeance, aujourdhui)
}

/** Un titre de tâche en fin de phrase : un point final, sauf s'il en a déjà un. */
function finDePhrase(texte: string): string {
  const net = texte.trim()
  return /[.!?…]$/.test(net) ? net : `${net}.`
}

/**
 * « Rien de prévu pour ce projet. Camille a une action jeudi 26 nov. : Envoyer l'avis de
 * valeur. » La seconde phrase seulement si le contact a une action prévue ailleurs.
 */
export function phraseRienDePrevu(ailleurs: ActionAilleurs | null, aujourdhui: string): string {
  const debut = 'Rien de prévu pour ce projet.'
  if (ailleurs === null) return debut
  return `${debut} ${ailleurs.qui} a une action ${quand(ailleurs.echeance, aujourdhui)} : ${finDePhrase(ailleurs.titre)}`
}

/**
 * Carte orange ou phrase grise. L'orange est réservé au vrai risque : un projet en cours
 * dont le contact n'a rien de prévu, ni ici ni ailleurs. Si le contact a une action ailleurs,
 * ou si le projet n'est plus en cours (hors du pipeline, gagné, archivé), « À venir » le dit
 * en gris. `tache` : le projet a au moins une tâche à faire.
 */
export function suiteProjet({
  tache,
  actif,
  ailleurs,
  aujourdhui,
}: {
  tache: boolean
  actif: boolean
  ailleurs: ActionAilleurs | null
  aujourdhui: string
}): Exclude<SuiteProjet, { forme: 'chargement' }> {
  if (tache) return { forme: 'tache' }
  if (actif && ailleurs === null) return { forme: 'alerte' }
  return { forme: 'phrase', phrase: phraseRienDePrevu(ailleurs, aujourdhui) }
}

/**
 * Ce que dit une rubrique de tâches vide sur la fiche Projet (`SectionTaches`, `vide`).
 * « À venir » (onglet Activité) : la phrase grise et « Planifier pour ce projet », ou rien du
 * tout quand la carte orange le dit déjà au-dessus. L'onglet Tâches ne répète pas l'alerte et
 * ne double pas son bouton.
 */
export function videTachesProjet(
  suite: SuiteProjet,
  rubrique: 'a_venir' | 'taches',
  lectureSeule: boolean,
): VideTaches {
  if (suite.forme === 'phrase') return { phrase: suite.phrase, ajout: !lectureSeule }
  if (rubrique === 'a_venir') return 'masquer'
  return { phrase: suite.forme === 'alerte' ? TACHES_A_VENIR_PROJET : '', ajout: false }
}

/** Qui a l'action ailleurs, dans la phrase : le prénom, sinon le nom (une société). */
export function quiDansLaPhrase(
  contact: Parameters<typeof nomComplet>[0] & Pick<Contact, 'prenom'>,
): string {
  return contact.prenom.trim() === '' ? nomComplet(contact) : contact.prenom.trim()
}
