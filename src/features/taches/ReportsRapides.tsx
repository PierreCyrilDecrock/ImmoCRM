import Icone from '../../components/Icone'
import { VISIBLE_AU_SURVOL } from '../../components/survol'
import { formaterJourCourt } from '../../lib/dates'
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
  /** Montre « Reporter » devant les boutons, à partir de la tablette. */
  avecLibelle?: boolean
}

const CLASSES_BOUTON =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-surface px-2.5 text-sm font-semibold text-encre ring-1 ring-bord-fort/40 ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60'

/**
 * Reports en un geste : « Demain », « Dans 3 jours », « Lundi » (le prochain), et le
 * calendrier pour une autre date. Le report s'enregistre aussitôt ; la confirmation propose
 * « Annuler » (voir `useActionsTache`). Les dates viennent de `reportsRapides`.
 */
export default function ReportsRapides({
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
