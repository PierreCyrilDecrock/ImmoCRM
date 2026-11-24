import { useEffect, useRef } from 'react'
import { LARGEUR_FONDU, masqueFondu, positionPourMontrer, useSuitesCachees } from './defilement'

type Props<V extends string> = {
  /** Nom de l'ensemble, lu par les lecteurs d'écran. */
  libelle: string
  options: readonly { valeur: V; libelle: string; compteur?: number | null }[]
  valeur: V
  onChange: (valeur: V) => void
  /**
   * Identifiant du panneau que les onglets commandent (`OngletsFiche`) : chaque onglet reçoit
   * l'identifiant `<panneau>-<valeur>` et désigne le panneau.
   */
  panneau?: string
  /**
   * `segmentee` (par défaut) : capsule grise, le choix actif en blanc (vues d'une page,
   * rubriques d'une fiche). `soulignee` : onglets de page, le choix actif souligné d'un trait
   * d'encre (Vendeurs / Acquéreurs). `pastilles` : petites pastilles, l'active en encre, pour
   * un second niveau de choix sous des onglets soulignés (En cours, Perdus…).
   */
  forme?: 'segmentee' | 'soulignee' | 'pastilles'
}

const CLASSES_GROUPE = {
  segmentee: 'inline-flex gap-1 rounded-xl bg-creux p-1',
  soulignee: 'flex min-w-full gap-6 border-b border-bord',
  pastilles: 'inline-flex gap-1',
} as const

/** Le bouton d'un onglet, selon la forme et selon qu'il est choisi. */
function classesOnglet(forme: keyof typeof CLASSES_GROUPE, actif: boolean): string {
  const commun =
    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
  if (forme === 'soulignee') {
    // Le trait du choix actif recouvre le filet du groupe.
    return `${commun} -mb-px min-h-11 border-b-2 text-base ${
      actif
        ? 'border-encre font-semibold text-encre'
        : 'border-transparent font-medium text-encre-douce hover:text-encre'
    }`
  }
  if (forme === 'pastilles') {
    // 44 px de haut pour le doigt ; la pastille dessinée est plus petite (30 px, texte de 13 px).
    return `${commun} group/pastille min-h-11 rounded-full text-[0.8125rem]`
  }
  return `${commun} min-h-10 rounded-lg px-3.5 text-[0.9375rem] ${
    actif
      ? 'bg-surface font-semibold text-encre shadow-sm ring-1 ring-bord'
      : 'font-medium text-encre-douce hover:text-encre'
  }`
}

/** Le compteur qui suit un libellé ; rien s'il n'est pas (encore) connu. */
function compteur(valeur: number | null | undefined, actif: boolean, surPastille: boolean) {
  if (valeur === undefined || valeur === null) return null
  const couleurs = surPastille
    ? actif
      ? 'text-fond'
      : 'text-encre-douce'
    : actif
      ? 'bg-encre text-fond'
      : 'bg-bord text-encre-douce'
  return (
    <span
      className={`text-xs font-semibold tabular-nums ${surPastille ? '' : 'rounded-full px-2'} ${couleurs}`}
    >
      {valeur}
    </span>
  )
}

/**
 * Onglets d'une page (les vues de la page Tâches) : une commande segmentée, c'est-à-dire des
 * choix posés dans une capsule grise, le choix actif en blanc. Sur un écran étroit, la capsule
 * défile de côté plutôt que d'élargir la page : tant que des onglets dépassent, un fondu sur
 * le bord droit (et gauche après défilement) le signale, et l'onglet choisi est toujours
 * ramené hors du fondu. Un compteur facultatif suit chaque libellé. Deux autres formes
 * (`forme`) : des onglets de page soulignés, et de petites pastilles.
 */
export default function Onglets<V extends string>({
  libelle,
  options,
  valeur,
  onChange,
  panneau,
  forme = 'segmentee',
}: Props<V>) {
  const ongletActif = useRef<HTMLButtonElement>(null)
  const rangee = useRef<HTMLDivElement>(null)
  const dejaPlace = useRef(false)
  const suites = useSuitesCachees(rangee)
  const masque = masqueFondu(suites)
  // Les largeurs changent quand un libellé ou un compteur change (compteurs lus après coup).
  const largeurs = options.map((option) => `${option.libelle}${option.compteur ?? ''}`).join('|')

  // Sur un écran étroit, l'onglet choisi est ramené dans la partie visible de la rangée, à
  // l'écart des fondus. Seule la rangée défile, jamais la page (pas de `scrollIntoView`).
  useEffect(() => {
    const element = rangee.current
    const onglet = ongletActif.current
    if (element === null || onglet === null) return
    const position = positionPourMontrer(
      { debut: onglet.offsetLeft, fin: onglet.offsetLeft + onglet.offsetWidth },
      { position: element.scrollLeft, visible: element.clientWidth, totale: element.scrollWidth },
    )
    if (Math.abs(position - element.scrollLeft) >= 1) {
      element.scrollTo({ left: position, behavior: dejaPlace.current ? 'smooth' : 'auto' })
    }
    dejaPlace.current = true
  }, [valeur, largeurs])

  return (
    <div
      ref={rangee}
      // `relative` : la position de chaque onglet se mesure depuis le début de la rangée.
      className="relative -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
      style={
        masque === undefined
          ? undefined
          : // Tant que la rangée déborde, une marge de la largeur du fondu après le dernier
            // onglet : défilée jusqu'au bout, elle le montre en entier, hors du fondu.
            { maskImage: masque, WebkitMaskImage: masque, paddingRight: LARGEUR_FONDU }
      }
    >
      <div role="tablist" aria-label={libelle} className={CLASSES_GROUPE[forme]}>
        {options.map((option) => {
          const actif = option.valeur === valeur
          return (
            <button
              key={option.valeur}
              ref={actif ? ongletActif : undefined}
              type="button"
              role="tab"
              id={panneau === undefined ? undefined : `${panneau}-${option.valeur}`}
              aria-controls={panneau}
              aria-selected={actif}
              onClick={() => onChange(option.valeur)}
              className={classesOnglet(forme, actif)}
            >
              {forme === 'pastilles' ? (
                <span
                  className={`inline-flex min-h-[1.875rem] items-center gap-1 rounded-full px-2 ${
                    actif
                      ? 'bg-encre font-semibold text-fond'
                      : 'bg-surface font-medium text-encre ring-1 ring-bord-fort/40 ring-inset group-hover/pastille:bg-creux'
                  }`}
                >
                  {option.libelle}
                  {compteur(option.compteur, actif, true)}
                </span>
              ) : (
                <>
                  {option.libelle}
                  {compteur(option.compteur, actif, false)}
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
