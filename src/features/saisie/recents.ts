import { useEffect, useSyncExternalStore } from 'react'
import type { NomIcone } from '../../components/Icone'

/**
 * Fiches consultées récemment : contacts, biens, projets de vente et d'achat. Elles sont
 * gardées sur l'appareil (pas dans la base), les plus récentes d'abord, pour y revenir d'un
 * geste depuis le bouton « + » ou le champ de recherche. La liste est effacée à la
 * déconnexion.
 */

export type GenreFiche = 'contact' | 'bien' | 'vendeur' | 'acquereur'

export type FicheRecente = {
  genre: GenreFiche
  id: string
  /** Ce qui s'affiche : le nom du contact, l'adresse du bien, le titre du projet. */
  titre: string
  detail: string
  /** Instant de la dernière consultation (millisecondes). */
  vue: number
}

/** Nombre de fiches gardées. */
export const MAX_RECENTES = 12

const CLE = 'immocrm.fiches-recentes'

const GENRES: Record<GenreFiche, { libelle: string; icone: NomIcone; chemin: string }> = {
  contact: { libelle: 'Contact', icone: 'contacts', chemin: '/contacts/' },
  bien: { libelle: 'Bien', icone: 'biens', chemin: '/biens/' },
  vendeur: { libelle: 'Projet de vente', icone: 'pipelines', chemin: '/pipelines/vendeurs/' },
  acquereur: { libelle: "Projet d'achat", icone: 'pipelines', chemin: '/pipelines/acquereurs/' },
}

export function adresseFiche(fiche: Pick<FicheRecente, 'genre' | 'id'>): string {
  return `${GENRES[fiche.genre].chemin}${fiche.id}`
}

export function iconeFiche(genre: GenreFiche): NomIcone {
  return GENRES[genre].icone
}

export function libelleGenreFiche(genre: GenreFiche): string {
  return GENRES[genre].libelle
}

/** Ajoute (ou remonte en tête) une fiche consultée ; la liste reste bornée. */
export function noterConsultation(
  liste: readonly FicheRecente[],
  fiche: FicheRecente,
  max: number = MAX_RECENTES,
): FicheRecente[] {
  const autres = liste.filter(
    (ancienne) => ancienne.genre !== fiche.genre || ancienne.id !== fiche.id,
  )
  return [fiche, ...autres].slice(0, max)
}

/** Retire une fiche (supprimée, fusionnée) de la liste. */
export function oublierFiche(
  liste: readonly FicheRecente[],
  fiche: Pick<FicheRecente, 'genre' | 'id'>,
): FicheRecente[] {
  return liste.filter((ancienne) => ancienne.genre !== fiche.genre || ancienne.id !== fiche.id)
}

function estFiche(valeur: unknown): valeur is FicheRecente {
  if (typeof valeur !== 'object' || valeur === null) return false
  const fiche = valeur as Record<string, unknown>
  return (
    typeof fiche.genre === 'string' &&
    fiche.genre in GENRES &&
    typeof fiche.id === 'string' &&
    typeof fiche.titre === 'string' &&
    typeof fiche.detail === 'string' &&
    typeof fiche.vue === 'number'
  )
}

/** Relit la liste enregistrée ; une liste abîmée ou d'une autre version est ignorée. */
export function lireRecentes(brut: string | null): FicheRecente[] {
  if (brut === null) return []
  try {
    const valeur: unknown = JSON.parse(brut)
    return Array.isArray(valeur) ? valeur.filter(estFiche).slice(0, MAX_RECENTES) : []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Mémoire de l'appareil
// ---------------------------------------------------------------------------

const AUCUNE: FicheRecente[] = []
const abonnes = new Set<() => void>()
let enMemoire: FicheRecente[] | null = null

function lireMemoire(): FicheRecente[] {
  if (enMemoire === null) {
    try {
      enMemoire = lireRecentes(window.localStorage.getItem(CLE))
    } catch {
      // Stockage refusé (navigation privée) : la liste vit le temps de la page.
      enMemoire = []
    }
  }
  return enMemoire
}

function ecrireMemoire(liste: FicheRecente[]) {
  enMemoire = liste
  try {
    if (liste.length === 0) window.localStorage.removeItem(CLE)
    else window.localStorage.setItem(CLE, JSON.stringify(liste))
  } catch {
    // Sans stockage, la liste reste en mémoire : rien de grave.
  }
  abonnes.forEach((prevenir) => prevenir())
}

function sAbonner(prevenir: () => void) {
  abonnes.add(prevenir)
  return () => {
    abonnes.delete(prevenir)
  }
}

/** Les fiches consultées récemment ; se met à jour toute seule. */
export function useFichesRecentes(): FicheRecente[] {
  return useSyncExternalStore(sAbonner, lireMemoire, () => AUCUNE)
}

/** Note la fiche affichée, dès qu'elle est lue. `null` tant qu'elle ne l'est pas. */
export function useConsultation(fiche: Omit<FicheRecente, 'vue'> | null) {
  const genre = fiche?.genre
  const id = fiche?.id
  const titre = fiche?.titre
  const detail = fiche?.detail
  useEffect(() => {
    if (genre === undefined || id === undefined || titre === undefined || detail === undefined) {
      return
    }
    ecrireMemoire(noterConsultation(lireMemoire(), { genre, id, titre, detail, vue: Date.now() }))
  }, [genre, id, titre, detail])
}

/** Retire une fiche de la liste (après une suppression ou une fusion). */
export function retirerDesRecentes(fiche: Pick<FicheRecente, 'genre' | 'id'>) {
  ecrireMemoire(oublierFiche(lireMemoire(), fiche))
}

/** Efface toute la liste : à la déconnexion, rien ne doit rester sur l'appareil. */
export function effacerRecentes() {
  ecrireMemoire([])
}
