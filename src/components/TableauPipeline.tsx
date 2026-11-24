import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as EvenementPointeur,
  type ReactNode,
} from 'react'
import { masqueFondu, useSuitesCachees } from './defilement'
import { basculerCritere, separerEtapes } from './tableau-pipeline'

/** Une colonne du tableau : une étape, son critère de sortie et ses projets. */
export type ColonnePipeline<E extends string, P> = {
  etape: E
  libelle: string
  critere: string
  projets: P[]
}

type Props<E extends string, P> = {
  colonnes: readonly ColonnePipeline<E, P>[]
  /** Identifiant d'un projet. */
  cle: (projet: P) => string
  /** L'étape où se trouve un projet. */
  etapeDe: (projet: P) => E
  /** Reconnaît une étape lue dans la page (colonne sous le pointeur). */
  estEtape: (valeur: string) => valeur is E
  /** Le nom qui suit le pointeur pendant un glisser. */
  nomGlisse: (projet: P) => string
  /** La carte d'un projet ; `onSaisir` n'est fourni que sur tablette et ordinateur. */
  carte: (
    projet: P,
    options: {
      estompee: boolean
      onSaisir?: (evenement: EvenementPointeur<HTMLButtonElement>) => void
    },
  ) => ReactNode
  /** Une carte a été déposée dans une autre colonne. */
  onDeposer: (projet: P, cible: E) => void
  /** Projet en cours d'enregistrement : sa carte est estompée. */
  enCours: string | null
}

/**
 * Téléphone : les étapes sans projet, repliées en une ligne de pastilles (« Estimation 0 »).
 * Toucher une pastille montre son critère, rien d'autre ; la toucher de nouveau le cache. Si
 * la ligne déborde, elle défile de côté et un fondu signale la suite, d'un côté ou des deux.
 */
function EtapesVides<E extends string>({
  colonnes,
}: {
  colonnes: readonly { etape: E; libelle: string; critere: string }[]
}) {
  const [montree, setMontree] = useState<E | null>(null)
  const rangee = useRef<HTMLDivElement>(null)
  const masque = masqueFondu(useSuitesCachees(rangee))
  const id = useId()
  const choisie = colonnes.find((colonne) => colonne.etape === montree)
  return (
    <section aria-labelledby={`${id}-titre`} className="flex flex-col gap-1">
      <h2 id={`${id}-titre`} className="text-sm font-medium text-encre-douce">
        Étapes sans projet
      </h2>
      <div className="-mx-4">
        <div
          ref={rangee}
          className="flex gap-1 overflow-x-auto px-4"
          style={masque === undefined ? undefined : { maskImage: masque, WebkitMaskImage: masque }}
        >
          {colonnes.map(({ etape, libelle }) => {
            const ouverte = etape === montree
            return (
              <button
                key={etape}
                type="button"
                aria-expanded={ouverte}
                aria-controls={`${id}-critere`}
                onClick={() => setMontree(basculerCritere(montree, etape))}
                className="flex min-h-11 shrink-0 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span
                  className={`inline-flex min-h-[1.875rem] items-center gap-1 rounded-full px-2.5 text-[0.8125rem] whitespace-nowrap ${
                    ouverte
                      ? 'bg-encre font-semibold text-fond'
                      : 'bg-surface font-medium text-encre ring-1 ring-bord-fort/40 ring-inset'
                  }`}
                >
                  {libelle}
                  <span className={`tabular-nums ${ouverte ? '' : 'text-encre-douce'}`}>0</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <p id={`${id}-critere`} aria-live="polite" className="text-sm text-encre-douce">
        {choisie !== undefined && `${choisie.libelle} : ${choisie.critere}`}
      </p>
    </section>
  )
}

/** Marge (px) près du bord du tableau où il défile tout seul pendant un glisser. */
const BORD_DEFILEMENT = 48

/**
 * Tableau d'un pipeline. Sur téléphone : une liste groupée par étape, les étapes vides
 * repliées en une ligne de pastilles. Sur tablette et
 * ordinateur : une colonne par étape ; une carte se glisse par sa poignée vers une autre
 * colonne (souris, doigt ou stylet). Le changement d'étape lui-même (critères, fenêtre de
 * saisie) est confié à `onDeposer`. Sans logique métier : il sert aux pipelines vendeur et
 * acquéreur.
 */
export default function TableauPipeline<E extends string, P>({
  colonnes,
  cle,
  etapeDe,
  estEtape,
  nomGlisse,
  carte,
  onDeposer,
  enCours,
}: Props<E, P>) {
  const [glisse, setGlisse] = useState<{ projet: P; x: number; y: number } | null>(null)
  const { pleines, vides } = separerEtapes(colonnes)
  const [survol, setSurvol] = useState<E | null>(null)
  const tableau = useRef<HTMLDivElement>(null)
  // Le projet saisi, lu au lâcher (hors du rendu).
  const saisi = useRef<P | null>(null)
  // Les fonctions les plus récentes, sans relancer l'écoute du pointeur à chaque rendu.
  const rappels = useRef({ onDeposer, etapeDe, estEtape })
  useEffect(() => {
    rappels.current = { onDeposer, etapeDe, estEtape }
  }, [onDeposer, etapeDe, estEtape])

  // Le projet glissé, lu au lâcher par les écouteurs du pointeur.
  const projetGlisse = glisse?.projet ?? null
  useEffect(() => {
    saisi.current = projetGlisse
  }, [projetGlisse])

  const glisseId = glisse === null ? null : cle(glisse.projet)
  useEffect(() => {
    if (glisseId === null) return
    /** L'étape de la colonne sous le pointeur, ou `null`. */
    function etapeSous(x: number, y: number): E | null {
      const valeur = document
        .elementFromPoint(x, y)
        ?.closest('[data-etape]')
        ?.getAttribute('data-etape')
      return valeur !== undefined && valeur !== null && rappels.current.estEtape(valeur)
        ? valeur
        : null
    }
    function bouger(evenement: PointerEvent) {
      setGlisse((actuel) =>
        actuel === null ? null : { ...actuel, x: evenement.clientX, y: evenement.clientY },
      )
      setSurvol(etapeSous(evenement.clientX, evenement.clientY))
      // Près d'un bord, le tableau défile pour atteindre les colonnes cachées.
      const zone = tableau.current?.getBoundingClientRect()
      if (zone !== undefined && tableau.current !== null) {
        if (evenement.clientX < zone.left + BORD_DEFILEMENT) tableau.current.scrollLeft -= 16
        if (evenement.clientX > zone.right - BORD_DEFILEMENT) tableau.current.scrollLeft += 16
      }
    }
    function lacher(evenement: PointerEvent) {
      const cible = etapeSous(evenement.clientX, evenement.clientY)
      const projet = saisi.current
      saisi.current = null
      setGlisse(null)
      setSurvol(null)
      if (projet !== null && cible !== null && cible !== rappels.current.etapeDe(projet)) {
        rappels.current.onDeposer(projet, cible)
      }
    }
    function annuler() {
      saisi.current = null
      setGlisse(null)
      setSurvol(null)
    }
    function touche(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') annuler()
    }
    window.addEventListener('pointermove', bouger)
    window.addEventListener('pointerup', lacher)
    window.addEventListener('pointercancel', annuler)
    window.addEventListener('keydown', touche)
    return () => {
      window.removeEventListener('pointermove', bouger)
      window.removeEventListener('pointerup', lacher)
      window.removeEventListener('pointercancel', annuler)
      window.removeEventListener('keydown', touche)
    }
  }, [glisseId])

  function saisir(projet: P, evenement: EvenementPointeur<HTMLButtonElement>) {
    if (evenement.button !== 0) return
    evenement.preventDefault()
    setGlisse({ projet, x: evenement.clientX, y: evenement.clientY })
    setSurvol(etapeDe(projet))
  }

  return (
    <>
      {/* Téléphone : liste groupée par étape ; les étapes vides tiennent sur une ligne. */}
      <div className="flex flex-col gap-6 md:hidden">
        {vides.length > 0 && <EtapesVides colonnes={vides} />}
        {pleines.map(({ etape, libelle, critere, projets }) => (
          <section key={etape} aria-label={libelle} className="flex flex-col gap-2">
            <h2 className="flex items-baseline justify-between gap-2">
              <span className="text-lg font-semibold text-encre">
                {libelle}{' '}
                <span className="text-base font-normal text-encre-douce">· {projets.length}</span>
              </span>
              <span className="text-sm text-encre-douce">{critere}</span>
            </h2>
            {projets.map((projet) => (
              <div key={cle(projet)}>{carte(projet, { estompee: enCours === cle(projet) })}</div>
            ))}
          </section>
        ))}
      </div>

      {/* Tablette et ordinateur : une colonne par étape. */}
      <div
        ref={tableau}
        className={`hidden gap-3 overflow-x-auto pb-2 md:flex ${glisse !== null ? 'cursor-grabbing select-none' : ''}`}
      >
        {colonnes.map(({ etape, libelle, critere, projets }) => {
          const cible = glisse !== null && survol === etape && etapeDe(glisse.projet) !== etape
          return (
            <section
              key={etape}
              data-etape={etape}
              aria-label={libelle}
              className={`flex min-h-64 min-w-48 flex-1 flex-col gap-2 rounded-2xl p-2 ring-2 transition-colors ${
                cible ? 'bg-accent-doux ring-accent' : 'bg-creux/60 ring-transparent'
              }`}
            >
              <header className="px-1 pt-1">
                <h2 className="flex items-baseline justify-between gap-2 text-base font-semibold text-encre">
                  {libelle}
                  <span className="text-sm font-normal text-encre-douce">{projets.length}</span>
                </h2>
                <p className="text-xs text-encre-douce">{critere}</p>
              </header>
              {projets.map((projet) => (
                <div key={cle(projet)}>
                  {carte(projet, {
                    estompee: glisseId === cle(projet) || enCours === cle(projet),
                    onSaisir: (evenement) => saisir(projet, evenement),
                  })}
                </div>
              ))}
            </section>
          )
        })}
      </div>

      {glisse !== null && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 max-w-56 -translate-x-1/2 -translate-y-1/2 truncate rounded-xl bg-surface px-3 py-2 font-semibold text-encre shadow-lg ring-2 ring-accent"
          style={{ left: glisse.x, top: glisse.y }}
        >
          {nomGlisse(glisse.projet)}
        </div>
      )}
    </>
  )
}
