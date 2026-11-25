import type { CSSProperties } from 'react'

type Props = {
  /**
   * Variables CSS du thème à montrer (`variablesApercu`) : l'aperçu les pose sur lui-même,
   * sans toucher au reste de la page. Sans elles, il montre le thème en service.
   */
  variables?: Record<string, string>
  /** Sans titre ni second contact : pour l'aperçu qui reste en haut de l'éditeur, au téléphone. */
  compact?: boolean
}

/**
 * Un morceau d'écran « Aujourd'hui » (données inventées) : la carte « Maintenant », deux
 * contacts, deux pastilles et le bouton bleu. Il montre d'un coup d'œil l'effet d'un thème :
 * couleurs, police, taille du texte et arrondis.
 */
export default function ApercuTheme({ variables, compact = false }: Props) {
  return (
    <div
      aria-hidden="true"
      style={variables as CSSProperties | undefined}
      className="flex flex-col gap-2.5 rounded-2xl bg-fond p-3 font-sans text-encre ring-1 ring-bord select-none"
    >
      <p className={`px-1 text-xl font-bold tracking-tight ${compact ? 'max-lg:hidden' : ''}`}>
        Aujourd'hui
      </p>
      <div className="flex flex-col gap-2.5 rounded-2xl bg-inverse p-3.5 text-sur-inverse ring-1 ring-bord-inverse">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold tracking-wide text-sur-inverse-doux">
            MAINTENANT · 10:30
          </p>
          <p className="text-lg font-semibold tracking-tight">Rappeler Camille Fictif</p>
          <p className="text-sm text-sur-inverse-doux">Avis de valeur · 12 rue des Exemples</p>
        </div>
        <div className="flex gap-2 *:flex *:min-h-11 *:flex-1 *:items-center *:justify-center *:rounded-lg *:bg-inverse-creux *:text-moyen *:font-semibold">
          <span>Appeler</span>
          <span>Reporter</span>
        </div>
      </div>
      <div className="divide-y divide-bord overflow-hidden rounded-2xl bg-surface ring-1 ring-bord">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-creux text-petit font-semibold">
            DE
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-moyen font-medium">
              Dominique <b className="font-semibold">Exemple</b>
            </span>
            <span className="truncate text-petit text-encre-douce">Acquéreur · 320 000 €</span>
          </span>
          <span className="shrink-0 rounded-full bg-danger-doux px-2 py-0.5 text-mini font-semibold text-danger">
            Retard 2 j
          </span>
        </div>
        <div className={`flex items-center gap-2.5 px-3 py-2.5 ${compact ? 'max-lg:hidden' : ''}`}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-creux text-petit font-semibold">
            AM
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-moyen font-medium">
              Alix <b className="font-semibold">Modèle</b>
            </span>
            <span className="truncate text-petit text-encre-douce">
              Vendeur · <span className="font-medium text-accent underline">voir le bien</span>
            </span>
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-encre px-3 py-1.5 text-petit font-semibold text-surface">
          Chaud
        </span>
        <span className="rounded-full bg-surface px-3 py-1.5 text-petit font-medium ring-1 ring-bord-fort ring-inset">
          Tiède
        </span>
        <span className="flex-1" />
        <span className="flex min-h-11 items-center rounded-lg bg-accent px-4 text-moyen font-semibold text-sur-plein shadow-sm shadow-accent/25">
          Ajouter
        </span>
      </div>
    </div>
  )
}
