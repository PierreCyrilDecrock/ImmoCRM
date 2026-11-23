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
  /**
   * Le dessin seul, dans un rond de 44 px (Appeler, Itinéraire d'une ligne de liste) : le
   * texte reste lu par les lecteurs d'écran et s'affiche en bulle au survol.
   */
  dessinSeul?: boolean
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
  dessinSeul = false,
  'aria-label': libelle,
}: Props) {
  const forme = dessinSeul ? 'size-11 shrink-0 rounded-full' : 'min-h-11 gap-1.5 rounded-lg px-3'
  const classes = `inline-flex items-center justify-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${forme} ${COULEURS[variante]}`
  const bulle = dessinSeul && typeof children === 'string' ? children : undefined
  const contenu = (
    <>
      <Icone nom={icone} className="size-5" />
      {dessinSeul ? <span className="sr-only">{children}</span> : children}
    </>
  )
  if (vers !== undefined) {
    return (
      <Link to={vers} className={classes} aria-label={libelle} title={bulle}>
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
      title={bulle}
      {...(nouvelOnglet ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {contenu}
    </a>
  )
}
