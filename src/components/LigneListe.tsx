import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Icone, { type NomIcone } from './Icone'

type Props = {
  titre: string
  /** Seconde ligne, plus discrète. */
  detail?: string
  /** Dessin affiché à gauche. */
  icone?: NomIcone
  /** Élément affiché à droite (une date, un badge…). */
  fin?: ReactNode
  /** Adresse de la page à ouvrir, par exemple « /contacts ». */
  vers?: string
  /** Action au toucher, quand la ligne n'ouvre pas une page. */
  onAction?: () => void
}

const CLASSES_LIGNE = 'flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left'
const CLASSES_ACTIVE =
  'hover:bg-creux focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent'

/** Ligne d'une `Liste`. Toute la ligne est touchable si elle a `vers` ou `onAction`. */
export default function LigneListe({ titre, detail, icone, fin, vers, onAction }: Props) {
  const contenu = (
    <>
      {icone !== undefined && <Icone nom={icone} className="size-6 text-encre-douce" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium text-encre">{titre}</span>
        {detail !== undefined && (
          <span className="block truncate text-sm text-encre-douce">{detail}</span>
        )}
      </span>
      {fin !== undefined && <span className="shrink-0 text-sm text-encre-douce">{fin}</span>}
      {vers !== undefined && <Icone nom="chevron" className="size-5 text-encre-douce" />}
    </>
  )

  return (
    <li>
      {vers !== undefined ? (
        <Link to={vers} className={`${CLASSES_LIGNE} ${CLASSES_ACTIVE}`}>
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
