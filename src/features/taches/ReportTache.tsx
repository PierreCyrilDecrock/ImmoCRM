import { useState, type FormEvent } from 'react'
import Bouton from '../../components/Bouton'
import ChampSaisie from '../../components/ChampSaisie'
import FenetreModale from '../../components/FenetreModale'
import { ajouterJours, estDateValide } from '../../lib/dates'
import { dateReport, libelleJour, REPORTS } from './echeances'
import type { Tache } from './taches'

type Props = {
  tache: Tache
  aujourdhui: string
  envoi: boolean
  onReporter: (echeance: string) => void
  onFermer: () => void
}

/**
 * Report d'une tâche : un délai se choisit d'un seul toucher (demain, dans 3 jours, dans une
 * semaine) ; une date libre se choisit dans le calendrier.
 */
export default function ReportTache({ tache, aujourdhui, envoi, onReporter, onFermer }: Props) {
  const [date, setDate] = useState(() =>
    tache.echeance > aujourdhui ? ajouterJours(tache.echeance, 1) : ajouterJours(aujourdhui, 1),
  )
  const [erreur, setErreur] = useState<string | undefined>(undefined)

  function choisirDate(evenement: FormEvent) {
    evenement.preventDefault()
    if (!estDateValide(date)) {
      setErreur('Choisissez une date.')
      return
    }
    onReporter(date)
  }

  return (
    <FenetreModale
      ouverte
      titre="Reporter à…"
      onFermer={onFermer}
      pied={
        <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
          Annuler
        </Bouton>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-base break-words text-encre">{tache.titre}</p>
        <div className="flex flex-col gap-2">
          {REPORTS.map((report) => {
            const nouvelle = dateReport(report.valeur, aujourdhui)
            return (
              <Bouton
                key={report.valeur}
                variante="secondaire"
                pleineLargeur
                disabled={envoi}
                onClick={() => onReporter(nouvelle)}
              >
                {report.libelle}
                <span className="font-normal text-encre-douce">
                  {report.valeur === 'demain' ? '' : libelleJour(nouvelle, aujourdhui)}
                </span>
              </Bouton>
            )
          })}
        </div>
        <form noValidate onSubmit={choisirDate} className="flex flex-col gap-2">
          <ChampSaisie
            libelle="Ou à une date précise"
            type="date"
            value={date}
            onChange={(evenement) => {
              setDate(evenement.target.value)
              setErreur(undefined)
            }}
            erreur={erreur}
          />
          <Bouton type="submit" variante="secondaire" disabled={envoi}>
            Reporter à cette date
          </Bouton>
        </form>
      </div>
    </FenetreModale>
  )
}
