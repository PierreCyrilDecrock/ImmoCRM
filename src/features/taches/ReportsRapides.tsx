import { useId, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import Icone from '../../components/Icone'
import { useMenuFlottant } from '../../components/menu-flottant'
import { VISIBLE_AU_SURVOL } from '../../components/survol'
import { formaterJourCourt } from '../../lib/dates'
import { useTailleEcran } from '../../lib/ecran'
import { reportsRapides } from './echeances'

type Props = {
  aujourdhui: string
  /** Ce qui est reporté, annoncé aux lecteurs d'écran : « Reporter « Rappeler Camille » ». */
  titre: string
  /** Un enregistrement est en cours : les boutons attendent. */
  desactive?: boolean
  /** Reporte aussitôt à cette date (sans fenêtre). */
  onReporter: (date: string) => void
  /** Le calendrier : ouvre la fenêtre `ReportTache` pour choisir une autre date. */
  onAutreDate: () => void
  /** Sur ordinateur, n'apparaît qu'au survol de la ligne (qui porte `group/ligne`) ou au clavier. */
  auSurvol?: boolean
  /**
   * Montre « Reporter » : devant la rangée, ou à côté de l'horloge repliée, à partir de la
   * tablette.
   */
  avecLibelle?: boolean
  /**
   * Forme repliée (étape E.3) : un seul bouton horloge, qui ouvre les reports dans une feuille
   * montant du bas sur téléphone, dans un petit menu près du bouton ailleurs.
   */
  replie?: boolean
}

const CLASSES_BOUTON =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-surface px-2.5 text-sm font-semibold text-encre ring-1 ring-bord-fort/40 ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60'

const CLASSES_ELEMENT =
  'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-base font-medium text-encre hover:bg-creux focus-visible:bg-creux focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent md:min-h-11'

/** Le menu est hors de la ligne dans la page : ses gestes ne doivent pas remonter jusqu'à elle. */
function arreter(evenement: SyntheticEvent) {
  evenement.stopPropagation()
}

/**
 * Reports en un geste : « Demain », « Dans 3 jours », « Lundi » (le prochain), et le
 * calendrier pour une autre date. Le report s'enregistre aussitôt ; la confirmation propose
 * « Annuler » (voir `useActionsTache`). Les dates viennent de `reportsRapides`.
 *
 * En rangée par défaut ; avec `replie`, derrière un seul bouton horloge.
 */
export default function ReportsRapides(props: Props) {
  return props.replie === true ? <ReportsReplies {...props} /> : <RangeeReports {...props} />
}

function RangeeReports({
  aujourdhui,
  titre,
  desactive = false,
  onReporter,
  onAutreDate,
  auSurvol = false,
  avecLibelle = false,
}: Props) {
  return (
    <div
      role="group"
      aria-label={`Reporter « ${titre} »`}
      className={`flex flex-wrap items-center gap-1.5 ${auSurvol ? VISIBLE_AU_SURVOL : ''}`}
    >
      {avecLibelle && (
        <span className="hidden text-sm text-encre-douce md:inline" aria-hidden="true">
          Reporter
        </span>
      )}
      {reportsRapides(aujourdhui).map((report) => {
        const jour = formaterJourCourt(report.date, aujourdhui)
        return (
          <button
            key={report.valeur}
            type="button"
            disabled={desactive}
            onClick={() => onReporter(report.date)}
            title={`Reporter au ${jour}`}
            aria-label={`${report.libelle}, ${jour}`}
            className={CLASSES_BOUTON}
          >
            {report.libelle}
          </button>
        )
      })}
      <button
        type="button"
        disabled={desactive}
        onClick={onAutreDate}
        title="Reporter à une autre date"
        aria-label="Autre date"
        className={`${CLASSES_BOUTON} w-11 px-0`}
      >
        <Icone nom="calendrier" className="size-5" />
      </button>
    </div>
  )
}

function ReportsReplies({
  aujourdhui,
  titre,
  desactive = false,
  onReporter,
  onAutreDate,
  avecLibelle = false,
}: Props) {
  const id = useId()
  const feuille = useTailleEcran() === 'telephone'
  const { ouvert, basculer, fermer, bouton, menu, style, surTouche } = useMenuFlottant(!feuille)
  const libelle = `Reporter « ${titre} »`

  /** Ferme le menu (le clavier revient au bouton), puis fait le geste choisi. */
  function choisir(geste: () => void) {
    fermer(true)
    geste()
  }

  const elements = (
    <>
      {reportsRapides(aujourdhui).map((report) => (
        <button
          key={report.valeur}
          type="button"
          role="menuitem"
          onClick={() => choisir(() => onReporter(report.date))}
          className={CLASSES_ELEMENT}
        >
          <Icone nom="horloge" className="size-5 shrink-0 text-encre-douce" />
          <span className="flex-1 whitespace-nowrap">{report.libelle}</span>
          <span className="text-sm whitespace-nowrap text-encre-douce tabular-nums">
            {formaterJourCourt(report.date, aujourdhui)}
          </span>
        </button>
      ))}
      <button
        type="button"
        role="menuitem"
        onClick={() => choisir(onAutreDate)}
        className={CLASSES_ELEMENT}
      >
        <Icone nom="calendrier" className="size-5 shrink-0 text-encre-douce" />
        Autre date…
      </button>
    </>
  )

  // Les gestes faits dans le menu restent au menu : la ligne glissable ne les voit pas.
  const arrets = {
    onPointerDown: arreter,
    onPointerMove: arreter,
    onPointerUp: arreter,
    onClick: arreter,
  }

  return (
    <>
      <button
        ref={bouton}
        type="button"
        disabled={desactive}
        onClick={basculer}
        aria-label={libelle}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-controls={ouvert ? id : undefined}
        title="Reporter"
        className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full text-encre-douce hover:bg-creux hover:text-encre focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${
          avecLibelle ? 'md:rounded-lg md:px-3 md:ring-1 md:ring-bord-fort/40 md:ring-inset' : ''
        } ${ouvert ? 'bg-creux text-encre' : ''}`}
      >
        <Icone nom="horloge" className="size-5" />
        {avecLibelle && (
          <span className="hidden text-sm font-semibold text-encre md:inline">Reporter</span>
        )}
      </button>
      {ouvert &&
        createPortal(
          feuille ? (
            <div {...arrets}>
              <div aria-hidden="true" className="fixed inset-0 z-40 bg-black/45" />
              <div
                ref={menu}
                id={id}
                role="menu"
                aria-label={libelle}
                onKeyDown={surTouche}
                className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-1 rounded-t-3xl bg-surface px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-2xl ring-1 ring-bord motion-safe:animate-monter"
              >
                <span
                  aria-hidden="true"
                  className="mx-auto mb-1 h-1 w-10 rounded-full bg-bord-fort/50"
                />
                <p aria-hidden="true" className="truncate px-3 pb-1 text-sm text-encre-douce">
                  Reporter « {titre} »
                </p>
                {elements}
              </div>
            </div>
          ) : (
            <div
              {...arrets}
              ref={menu}
              id={id}
              role="menu"
              aria-label={libelle}
              onKeyDown={surTouche}
              style={style}
              className="fixed z-30 flex w-72 max-w-[calc(100vw-1rem)] flex-col rounded-2xl bg-surface p-1.5 shadow-lg ring-1 ring-bord"
            >
              {elements}
            </div>
          ),
          document.body,
        )}
    </>
  )
}
