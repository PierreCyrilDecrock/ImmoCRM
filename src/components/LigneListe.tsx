import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Icone, { type NomIcone } from './Icone'

type Props = {
  /** Première ligne ; un texte, ou un nom mis en forme (« Camille **Fictif** »). */
  titre: ReactNode
  /**
   * L'adresse d'un bien : le titre peut passer sur deux lignes (puis « … ») au lieu d'être
   * coupé à la première, pour se lire en entier au téléphone.
   */
  titreSurDeuxLignes?: boolean
  /**
   * Seconde ligne, plus discrète. Un texte, ou un contenu mis en forme (le prix en encre et
   * en chiffres alignés, un retard en rouge) ; coupée par « … » si elle dépasse.
   */
  detail?: ReactNode
  /**
   * Élément court à droite de la seconde ligne, sur sa ligne (la pastille du statut d'un
   * bien). Il ne se coupe jamais : c'est le détail qui cède la place.
   */
  finDetail?: ReactNode
  /** Troisième ligne, en gris (la commune d'un bien). */
  sousDetail?: string
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
  titreSurDeuxLignes = false,
  detail,
  finDetail,
  sousDetail,
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
  const coupeTitre = titreSurDeuxLignes ? 'line-clamp-2 break-words' : 'truncate'
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
          <span className={`block text-base font-medium text-encre ${coupeTitre}`}>{titre}</span>
        ) : (
          <span className="flex items-center gap-2">
            <span className={`min-w-0 flex-1 text-base font-medium text-encre ${coupeTitre}`}>
              {titre}
            </span>
            {finTitre}
          </span>
        )}
        {detail !== undefined &&
          (finDetail === undefined ? (
            <span className="block truncate text-sm text-encre-douce">{detail}</span>
          ) : (
            <span className="mt-0.5 flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm text-encre-douce">{detail}</span>
              <span className="shrink-0">{finDetail}</span>
            </span>
          ))}
        {sousDetail !== undefined && (
          <span className="block truncate text-sm text-encre-douce">{sousDetail}</span>
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
