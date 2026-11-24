import type { ButtonHTMLAttributes } from 'react'
import Icone, { type NomIcone } from './Icone'

export type VarianteBouton = 'principal' | 'secondaire' | 'discret' | 'sobre' | 'danger' | 'inverse'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  /** `principal` : l'action attendue de l'écran (une seule par écran). */
  variante?: VarianteBouton
  /** Occupe toute la largeur : à préférer sur téléphone, en bas de formulaire. */
  pleineLargeur?: boolean
  /** Dessin affiché avant le texte. */
  icone?: NomIcone
}

const COULEURS: Record<VarianteBouton, string> = {
  principal: 'bg-accent text-sur-plein shadow-sm shadow-accent/25 hover:bg-accent-fort',
  secondaire: 'bg-surface text-encre shadow-xs ring-1 ring-inset ring-bord-fort/40 hover:bg-creux',
  discret: 'text-accent hover:bg-accent-doux',
  /** Gris, sans fond : une action annexe qui ne concurrence pas le bouton bleu. */
  sobre: 'text-encre-douce hover:bg-creux hover:text-encre',
  danger: 'bg-danger text-sur-plein hover:opacity-90',
  /** Sur le fond encre de la carte « Maintenant ». */
  inverse:
    'bg-inverse-creux text-sur-inverse ring-1 ring-inset ring-sur-inverse-doux/30 hover:bg-sur-inverse/20',
}

/** Bouton d'action. Toujours au moins 44 px de haut pour être touché du doigt. */
export default function Bouton({
  variante = 'principal',
  pleineLargeur = false,
  icone,
  type = 'button',
  children,
  ...bouton
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${COULEURS[variante]} ${pleineLargeur ? 'w-full' : ''}`}
      {...bouton}
    >
      {icone !== undefined && <Icone nom={icone} className="size-5" />}
      {children}
    </button>
  )
}
