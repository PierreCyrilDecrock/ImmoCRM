import { useId, type ReactNode } from 'react'
import Icone from './Icone'

type Props = {
  titre: string
  /** Le choix en cours, montré sous le titre même quand le volet est replié. */
  resume?: string
  ouvert: boolean
  onBasculer: () => void
  /** Petit geste à droite de l'en-tête, toujours visible (« Rétablir »). */
  action?: ReactNode
  children: ReactNode
}

/**
 * Une partie qui se replie d'un toucher sur son titre (page Apparence : Police, Taille du
 * texte, Arrondis), pour garder l'aperçu en vue pendant les changements. Un filet la sépare
 * de la précédente ; à placer dans une `Carte` ou un bloc blanc.
 */
export default function Volet({ titre, resume, ouvert, onBasculer, action, children }: Props) {
  const id = useId()
  return (
    <div className="border-t border-bord first:border-t-0">
      <div className="flex items-center gap-1 py-1">
        <button
          type="button"
          aria-expanded={ouvert}
          aria-controls={id}
          onClick={onBasculer}
          className="-ml-2 flex min-h-14 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 text-left text-encre hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Icone
            nom="chevron"
            className={`size-5 text-encre-douce transition-transform motion-reduce:transition-none ${ouvert ? 'rotate-90' : ''}`}
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-base font-semibold">{titre}</span>
            {resume !== undefined && (
              <span className="truncate text-sm text-encre-douce">{resume}</span>
            )}
          </span>
        </button>
        {action}
      </div>
      {ouvert && (
        <div id={id} className="flex flex-col gap-3 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}
