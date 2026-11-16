import type { ButtonHTMLAttributes } from 'react'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>

/** Bouton d'action principal, sur toute la largeur. */
export default function BoutonPrincipal({ type = 'button', ...bouton }: Props) {
  return (
    <button
      type={type}
      className="min-h-11 w-full rounded-lg bg-sky-700 px-4 text-base font-semibold text-white hover:bg-sky-800 focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:outline-none disabled:opacity-60"
      {...bouton}
    />
  )
}
