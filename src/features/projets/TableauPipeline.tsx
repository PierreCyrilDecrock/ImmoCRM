import { useEffect, useRef, useState, type PointerEvent as EvenementPointeur } from 'react'
import { nomComplet } from '../contacts/contacts'
import CarteProjet from './CarteProjet'
import {
  estEtapeVendeur,
  ETAPES_VENDEUR,
  grouperParEtape,
  libelleEtape,
  type EtapeVendeur,
} from './pipeline-vendeur'
import type { ProjetVendeurAffiche } from './projets-vendeurs'

type Props = {
  projets: readonly ProjetVendeurAffiche[]
  aujourdhui: string
  /** Une carte a été déposée dans une autre colonne. */
  onDeposer: (affiche: ProjetVendeurAffiche, cible: EtapeVendeur) => void
  /** Projet en cours d'enregistrement : sa carte est estompée. */
  enCours: string | null
}

type Glisse = { affiche: ProjetVendeurAffiche; x: number; y: number }

/** Marge (px) près du bord du tableau où il défile tout seul pendant un glisser. */
const BORD_DEFILEMENT = 48

/** L'étape de la colonne sous le pointeur, ou `null`. */
function etapeSous(x: number, y: number): EtapeVendeur | null {
  const valeur = document
    .elementFromPoint(x, y)
    ?.closest('[data-etape]')
    ?.getAttribute('data-etape')
  return valeur !== undefined && valeur !== null && estEtapeVendeur(valeur) ? valeur : null
}

/**
 * Le pipeline vendeur. Sur téléphone : une liste groupée par étape. Sur tablette et
 * ordinateur : une colonne par étape ; une carte se glisse par sa poignée vers une autre
 * colonne (souris, doigt ou stylet). Le changement d'étape lui-même (critères, fenêtre de
 * saisie) est confié à `onDeposer`.
 */
export default function TableauPipeline({ projets, aujourdhui, onDeposer, enCours }: Props) {
  const groupes = grouperParEtape(projets)
  const [glisse, setGlisse] = useState<Glisse | null>(null)
  const [survol, setSurvol] = useState<EtapeVendeur | null>(null)
  const tableau = useRef<HTMLDivElement>(null)
  // Le projet saisi, lu au lâcher (hors du rendu).
  const saisi = useRef<ProjetVendeurAffiche | null>(null)
  // La fonction la plus récente, sans relancer l'écoute du pointeur à chaque rendu.
  const deposer = useRef(onDeposer)
  useEffect(() => {
    deposer.current = onDeposer
  }, [onDeposer])

  const glisseId = glisse?.affiche.id ?? null
  useEffect(() => {
    if (glisseId === null) return
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
      const affiche = saisi.current
      saisi.current = null
      setGlisse(null)
      setSurvol(null)
      if (affiche !== null && cible !== null && cible !== affiche.projet.etape) {
        deposer.current(affiche, cible)
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

  function saisir(affiche: ProjetVendeurAffiche, evenement: EvenementPointeur<HTMLButtonElement>) {
    if (evenement.button !== 0) return
    evenement.preventDefault()
    saisi.current = affiche
    setGlisse({ affiche, x: evenement.clientX, y: evenement.clientY })
    setSurvol(affiche.projet.etape as EtapeVendeur)
  }

  return (
    <>
      {/* Téléphone : liste groupée par étape. */}
      <div className="flex flex-col gap-6 md:hidden">
        {groupes.map(({ etape, projets: dansEtape }) => {
          const { critere } = ETAPES_VENDEUR.find((e) => e.valeur === etape) ?? { critere: '' }
          return (
            <section key={etape} aria-label={libelleEtape(etape)} className="flex flex-col gap-2">
              <h2 className="flex items-baseline justify-between gap-2">
                <span className="text-lg font-semibold text-encre">
                  {libelleEtape(etape)}{' '}
                  <span className="text-base font-normal text-encre-douce">
                    · {dansEtape.length}
                  </span>
                </span>
                <span className="text-sm text-encre-douce">{critere}</span>
              </h2>
              {dansEtape.length === 0 ? (
                <p className="text-sm text-encre-douce">Aucun projet à cette étape.</p>
              ) : (
                dansEtape.map((affiche) => (
                  <CarteProjet
                    key={affiche.id}
                    affiche={affiche}
                    aujourdhui={aujourdhui}
                    estompee={enCours === affiche.id}
                  />
                ))
              )}
            </section>
          )
        })}
      </div>

      {/* Tablette et ordinateur : une colonne par étape. */}
      <div
        ref={tableau}
        className={`hidden gap-3 overflow-x-auto pb-2 md:flex ${glisse !== null ? 'cursor-grabbing select-none' : ''}`}
      >
        {groupes.map(({ etape, projets: dansEtape }) => {
          const { critere } = ETAPES_VENDEUR.find((e) => e.valeur === etape) ?? { critere: '' }
          const cible = glisse !== null && survol === etape && glisse.affiche.projet.etape !== etape
          return (
            <section
              key={etape}
              data-etape={etape}
              aria-label={libelleEtape(etape)}
              className={`flex min-h-64 min-w-44 flex-1 flex-col gap-2 rounded-2xl p-2 ring-2 transition-colors ${
                cible ? 'bg-accent-doux ring-accent' : 'bg-creux/60 ring-transparent'
              }`}
            >
              <header className="px-1 pt-1">
                <h2 className="flex items-baseline justify-between gap-2 text-base font-semibold text-encre">
                  {libelleEtape(etape)}
                  <span className="text-sm font-normal text-encre-douce">{dansEtape.length}</span>
                </h2>
                <p className="text-xs text-encre-douce">{critere}</p>
              </header>
              {dansEtape.map((affiche) => (
                <CarteProjet
                  key={affiche.id}
                  affiche={affiche}
                  aujourdhui={aujourdhui}
                  estompee={glisse?.affiche.id === affiche.id || enCours === affiche.id}
                  onSaisir={(evenement) => saisir(affiche, evenement)}
                />
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
          {glisse.affiche.contact === null ? 'Projet' : nomComplet(glisse.affiche.contact)}
        </div>
      )}
    </>
  )
}
