import { useEffect, useSyncExternalStore } from 'react'
import { CREATIONS, type Creation } from './raccourcis'

/**
 * Ce que crée le bouton « + » flottant (téléphone et tablette) : ce que montre la page.
 * Une liste déclare sa création (`useCreationDeLaPage`) ; ailleurs, le « + » ouvre le menu.
 * Revue de design, correction 6 : une seule façon de créer par écran.
 */
export type CreationPage = Creation | 'projetVendeur'

/** Libellé du « + » et de la fenêtre qu'il ouvre (lu par les lecteurs d'écran, en bulle). */
const LIBELLES: Record<CreationPage, string> = {
  contact: 'Nouveau contact',
  activite: 'Nouvelle activité',
  tache: 'Nouvelle tâche',
  bien: 'Nouveau bien',
  demande: 'Nouvelle demande entrante',
  projetVendeur: 'Nouveau projet vendeur',
}

/** Ce que fait le « + » : ouvrir le menu complet, ou directement la création de la page. */
export type ActionPlus =
  | { genre: 'menu'; libelle: string; bulle: string }
  | { genre: 'creer'; creation: CreationPage; libelle: string; bulle: string }

/**
 * L'action du « + » pour la création déclarée par la page (`null` : le menu). La bulle
 * rappelle la touche du clavier quand il y en a une (C, T, B, D ; pas de touche pour un projet
 * vendeur).
 */
export function actionDuPlus(creation: CreationPage | null): ActionPlus {
  if (creation === null) {
    return {
      genre: 'menu',
      libelle: 'Saisie rapide : créer un contact, une activité, une tâche…',
      bulle: 'Saisie rapide (N)',
    }
  }
  const libelle = LIBELLES[creation]
  const touche = CREATIONS.find((option) => option.creation === creation)?.touche
  return {
    genre: 'creer',
    creation,
    libelle,
    bulle: touche === undefined ? libelle : `${libelle} (${touche})`,
  }
}

// La création déclarée par la page affichée. Un jeton par déclaration : quand une page en
// remplace une autre, le retrait de l'ancienne n'efface pas la nouvelle.
type Declaration = { creation: CreationPage }
let declaree: Declaration | null = null
const ecouteurs = new Set<() => void>()

function prevenir() {
  ecouteurs.forEach((ecouteur) => ecouteur())
}

/** Déclare la création de la page ; renvoie la fonction qui la retire. */
export function declarerCreation(creation: CreationPage): () => void {
  const jeton: Declaration = { creation }
  declaree = jeton
  prevenir()
  return () => {
    if (declaree !== jeton) return
    declaree = null
    prevenir()
  }
}

/** La création déclarée par la page affichée, ou `null`. */
export function creationDeclaree(): CreationPage | null {
  return declaree?.creation ?? null
}

function abonner(ecouteur: () => void): () => void {
  ecouteurs.add(ecouteur)
  return () => {
    ecouteurs.delete(ecouteur)
  }
}

/** Pour une page : ce que crée le « + » tant qu'elle est affichée (`null` : le menu). */
export function useCreationDeLaPage(creation: CreationPage | null) {
  useEffect(() => (creation === null ? undefined : declarerCreation(creation)), [creation])
}

/** Pour le « + » : la création de la page affichée, suivie quand elle change. */
export function useCreationPage(): CreationPage | null {
  return useSyncExternalStore(abonner, creationDeclaree, () => null)
}
