import type { MouseEventHandler, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Icone, { type NomIcone } from './Icone'

type Props = {
  icone: NomIcone
  children: ReactNode
  /** Page de l'application à ouvrir (`/contacts/…`). */
  vers?: string
  /** Adresse externe (`tel:…`, application de cartes) : s'ouvre hors de l'application. */
  href?: string
  /** Ouvre l'adresse externe dans un nouvel onglet (cartes sur ordinateur). */
  nouvelOnglet?: boolean
  /**
   * `secondaire` (par défaut) : contour ; `discret` : texte seul ; `principal` : bleu plein
   * (le geste attendu, un seul par groupe) ; `inverse` : sur le fond encre de la carte
   * « Maintenant ».
   */
  variante?: 'secondaire' | 'discret' | 'principal' | 'inverse'
  onClick?: MouseEventHandler<HTMLAnchorElement>
  'aria-label'?: string
}

const COULEURS = {
  secondaire: 'bg-surface text-encre shadow-xs ring-1 ring-inset ring-bord-fort/40 hover:bg-creux',
  discret: 'text-accent hover:bg-accent-doux',
  principal: 'bg-accent text-sur-plein shadow-sm shadow-accent/25 hover:bg-accent-fort',
  inverse:
    'bg-inverse-creux text-sur-inverse ring-1 ring-inset ring-sur-inverse-doux/30 hover:bg-sur-inverse/20',
}

/**
 * Lien qui a l'allure d'un petit bouton : ouvrir une fiche, appeler, lancer l'itinéraire.
 * Pour les gestes rapides d'une ligne de liste (44 px de haut, dessin et texte court).
 */
export default function LienBouton({
  icone,
  children,
  vers,
  href,
  nouvelOnglet = false,
  variante = 'secondaire',
  onClick,
  'aria-label': libelle,
}: Props) {
  const classes = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${COULEURS[variante]}`
  const contenu = (
    <>
      <Icone nom={icone} className="size-5" />
      {children}
    </>
  )
  if (vers !== undefined) {
    return (
      <Link to={vers} className={classes} aria-label={libelle}>
        {contenu}
      </Link>
    )
  }
  return (
    <a
      href={href}
      className={classes}
      onClick={onClick}
      aria-label={libelle}
      {...(nouvelOnglet ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {contenu}
    </a>
  )
}
