import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Icone, { type NomIcone } from './Icone'

type Props = {
  /** Première ligne ; un texte, ou un nom mis en forme (« Camille **Fictif** »). */
  titre: ReactNode
  /** Seconde ligne, plus discrète. */
  detail?: string
  /** Dessin affiché à gauche. */
  icone?: NomIcone
  /** Élément affiché à gauche à la place du dessin (les initiales d'un contact). */
  debut?: ReactNode
  /**
   * Petite image carrée affichée à gauche (photo d'un bien). `null` : pas d'image, la place
   * est tenue par le dessin `icone`, pour que toutes les lignes restent alignées.
   */
  vignette?: string | null
  /** Élément affiché à droite (une date, un badge…). */
  fin?: ReactNode
  /**
   * Élément court affiché à droite du titre, sur sa ligne (un repère : retard, température).
   * Le détail garde ainsi toute la largeur dessous, ce qui compte sur téléphone.
   */
  finTitre?: ReactNode
  /**
   * Sur téléphone, pas de chevron : toute la ligne se touche, et le détail gagne la place
   * (liste des contacts, comme les relances de l'accueil). Il revient dès 768 px.
   */
  chevronDesTablette?: boolean
  /** Adresse de la page à ouvrir, par exemple « /contacts ». */
  vers?: string
  /**
   * Gardé dans l'historique du navigateur avec la page ouverte (`vers`) : la liste des
   * contacts y range sa recherche, pour que la fiche propose le contact suivant.
   */
  etat?: unknown
  /** Action au toucher, quand la ligne n'ouvre pas une page. */
  onAction?: () => void
}

const CLASSES_LIGNE = 'flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left'
const CLASSES_ACTIVE =
  'hover:bg-creux focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent'

/** Ligne d'une `Liste`. Toute la ligne est touchable si elle a `vers` ou `onAction`. */
export default function LigneListe({
  titre,
  detail,
  icone,
  debut,
  vignette,
  fin,
  finTitre,
  chevronDesTablette = false,
  vers,
  etat,
  onAction,
}: Props) {
  const contenu = (
    <>
      {debut !== undefined ? (
        debut
      ) : vignette !== undefined ? (
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-creux text-encre-douce">
          {vignette !== null ? (
            // Image décorative : le titre de la ligne dit déjà de quoi il s'agit.
            <img src={vignette} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            icone !== undefined && <Icone nom={icone} className="size-6" />
          )}
        </span>
      ) : (
        icone !== undefined && <Icone nom={icone} className="size-6 text-encre-douce" />
      )}
      <span className="min-w-0 flex-1">
        {finTitre === undefined ? (
          <span className="block truncate text-base font-medium text-encre">{titre}</span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-base font-medium text-encre">
              {titre}
            </span>
            {finTitre}
          </span>
        )}
        {detail !== undefined && (
          <span className="block truncate text-sm text-encre-douce">{detail}</span>
        )}
      </span>
      {fin !== undefined && <span className="shrink-0 text-sm text-encre-douce">{fin}</span>}
      {vers !== undefined && (
        <Icone
          nom="chevron"
          className={`size-5 shrink-0 text-encre-douce ${chevronDesTablette ? 'hidden md:block' : ''}`}
        />
      )}
    </>
  )

  return (
    <li>
      {vers !== undefined ? (
        <Link to={vers} state={etat} className={`${CLASSES_LIGNE} ${CLASSES_ACTIVE}`}>
          {contenu}
        </Link>
      ) : onAction !== undefined ? (
        <button type="button" onClick={onAction} className={`${CLASSES_LIGNE} ${CLASSES_ACTIVE}`}>
          {contenu}
        </button>
      ) : (
        <div className={CLASSES_LIGNE}>{contenu}</div>
      )}
    </li>
  )
}
