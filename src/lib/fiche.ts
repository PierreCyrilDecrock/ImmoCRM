import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useNotifications } from '../components/notifications-contexte'
import { estUnChamp } from './clavier'
import { depuisLeMoment, formaterDate } from './dates'
import type { LecteurPage } from './liste-paginee'
import {
  cleDeLEtat,
  libellePosition,
  noterIds,
  parcoursMemorise,
  rangDans,
  rangVoisin,
  remplacerParcours,
  type DomaineParcours,
} from './parcours'

/**
 * Ce qui est commun aux quatre fiches (Contact, Bien, projet de vente, projet d'achat ;
 * étapes D.5 et D.7) : l'onglet gardé dans l'adresse, les raccourcis du clavier, la fiche
 * précédente ou suivante de la liste d'où l'on vient, la ligne des dates. Les règles sont
 * pures et testées ; les crochets les branchent sur le navigateur.
 */

/**
 * Les deux colonnes des fiches Contact et Bien sur ordinateur : le profil, puis les onglets.
 * Le profil fait 280 px de 1024 à 1279 px, et 360 px au-delà (étape E.6) : l'adresse et le
 * dernier échange tiennent sur une ligne.
 */
export const GRILLE_FICHE =
  'grid items-start gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] xl:grid-cols-[22.5rem_minmax(0,1fr)]'

// ---------------------------------------------------------------------------
// Règles pures
// ---------------------------------------------------------------------------

/**
 * L'onglet à montrer d'après l'adresse (`?onglet=projets`) : celui demandé s'il fait partie
 * des onglets de la fiche à cette taille d'écran, sinon le premier.
 */
export function ongletDemande<V extends string>(demande: string | null, onglets: readonly V[]): V {
  const trouve = onglets.find((onglet) => onglet === demande)
  // Une fiche a toujours au moins un onglet.
  return trouve ?? (onglets[0] as V)
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
 * Les raccourcis d'une fiche, hors des champs : 1 à 5 pour les onglets (selon leur nombre),
 * J pour la fiche suivante de la liste, K pour la précédente (comme dans une messagerie).
 */
export function raccourciFiche(appui: AppuiFiche): RaccourciFiche | null {
  if (appui.dansUnChamp || appui.ctrlKey || appui.metaKey || appui.altKey) return null
  const touche = appui.key.toLowerCase()
  if (/^[1-5]$/.test(touche)) return { genre: 'onglet', rang: Number(touche) - 1 }
  if (touche === 'j') return { genre: 'suivant' }
  if (touche === 'k') return { genre: 'precedent' }
  return null
}

/**
 * « Fiche créée le 3 mars 2026 · modifiée il y a 2 jours ». Pour un projet : « Projet ouvert
 * le 3 mars 2026 · modifié hier » (`projet`).
 */
export function ligneDatesFiche(
  fiche: { created_at: string; updated_at: string },
  aujourdhui: string,
  projet = false,
): string {
  const modifiee = depuisLeMoment(fiche.updated_at, aujourdhui)
  const creee = `${projet ? 'Projet ouvert' : 'Fiche créée'} le ${formaterDate(fiche.created_at)}`
  return modifiee === '' ? creee : `${creee} · ${projet ? 'modifié' : 'modifiée'} ${modifiee}`
}

// ---------------------------------------------------------------------------
// Crochets
// ---------------------------------------------------------------------------

/**
 * L'onglet de la fiche, gardé dans l'adresse : changer d'onglet ajoute une entrée à
 * l'historique (le retour du navigateur ramène à l'onglet d'avant), et le parcours de la
 * liste (`state`) suit la fiche d'un onglet à l'autre.
 */
export function useOngletFiche<V extends string>(onglets: readonly V[]): [V, (suivant: V) => void] {
  const location = useLocation()
  const [parametres, setParametres] = useSearchParams()
  const onglet = ongletDemande(parametres.get('onglet'), onglets)

  function choisir(suivant: V) {
    if (suivant === onglet) return
    setParametres(
      (actuels) => {
        const nouveaux = new URLSearchParams(actuels)
        nouveaux.set('onglet', suivant)
        return nouveaux
      },
      { state: location.state },
    )
  }
  return [onglet, choisir]
}

/** Ce que la page passe à `NavigationFiche`, ou `null` sans parcours. */
export type ParcoursFiche = {
  position: string
  enCours: boolean
  onPrecedent?: () => void
  onSuivant?: () => void
  /** Passe à la fiche voisine (touches J et K). */
  aller: (sens: 1 | -1) => void
}

/**
 * Fiche précédente ou suivante de la liste d'où l'on vient (« 12 sur 48 »). `actif` : sur
 * ordinateur seulement (les flèches sont en haut de la fiche, à droite du retour).
 * `lirePage` : pour une liste lue page par page, de quoi lire la suite depuis la fiche ;
 * sans lui, la liste gardée est complète (colonne d'un pipeline).
 */
export function useParcoursFiche(options: {
  domaine: DomaineParcours
  id: string
  actif: boolean
  /** L'adresse de la fiche d'un voisin. */
  chemin: (id: string) => string
  lirePage?: LecteurPage<{ id: string }>
  /** « Le contact suivant n'a pas pu être lu. » : le message si la suite n'a pas pu être lue. */
  echec: string
}): ParcoursFiche | null {
  const { domaine, id, actif, chemin, lirePage, echec } = options
  const location = useLocation()
  const naviguer = useNavigate()
  const { notifier } = useNotifications()
  const [enCours, setEnCours] = useState(false)

  const cle = cleDeLEtat(location.state)
  const parcours = cle === null ? null : parcoursMemorise(domaine, cle)
  const rang = parcours === null ? null : rangDans(parcours, id)
  if (!actif || parcours === null || rang === null) return null

  async function aller(sens: 1 | -1) {
    if (parcours === null || rang === null || enCours) return
    const cible = rangVoisin(parcours, rang, sens)
    if (cible === null) return
    let voisin = parcours.ids[cible] ?? null
    if (voisin === null && lirePage !== undefined) {
      setEnCours(true)
      const page = await lirePage(parcours.cle, cible, false)
      setEnCours(false)
      if (!page.ok) {
        notifier('erreur', `${echec} ${page.erreur.message}`)
        return
      }
      const complete = noterIds(
        parcours,
        cible,
        page.donnees.lignes.map((ligne) => ligne.id),
      )
      remplacerParcours(domaine, complete)
      voisin = complete.ids[cible] ?? null
    }
    if (voisin === null) return
    void naviguer({ pathname: chemin(voisin), search: location.search }, { state: location.state })
  }

  return {
    position: libellePosition(rang, parcours.total),
    enCours,
    onPrecedent: rangVoisin(parcours, rang, -1) === null ? undefined : () => void aller(-1),
    onSuivant: rangVoisin(parcours, rang, 1) === null ? undefined : () => void aller(1),
    aller: (sens) => void aller(sens),
  }
}

/**
 * Les raccourcis d'une fiche, hors des champs, des fenêtres et des menus : 1 à 5 changent
 * d'onglet, J et K passent à la fiche voisine (quand on vient d'une liste).
 */
export function useRaccourcisFiche<V extends string>(options: {
  onglets: readonly V[]
  choisir: (onglet: V) => void
  parcours: ParcoursFiche | null
}): void {
  const { onglets, choisir, parcours } = options
  useEffect(() => {
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.repeat || evenement.defaultPrevented) return
      if (document.querySelector('dialog[open], [role="menu"]') !== null) return
      const raccourci = raccourciFiche({
        key: evenement.key,
        ctrlKey: evenement.ctrlKey,
        metaKey: evenement.metaKey,
        altKey: evenement.altKey,
        dansUnChamp: estUnChamp(document.activeElement),
      })
      if (raccourci === null) return
      if (raccourci.genre === 'onglet') {
        const choisi = onglets[raccourci.rang]
        if (choisi === undefined) return
        evenement.preventDefault()
        choisir(choisi)
      } else if (parcours !== null) {
        evenement.preventDefault()
        parcours.aller(raccourci.genre === 'suivant' ? 1 : -1)
      }
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  })
}
