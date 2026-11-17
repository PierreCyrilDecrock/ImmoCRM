import { useState, type ReactNode } from 'react'
import BoucleRelance from '../relances/BoucleRelance'
import { useActionsTache } from './actions-tache'
import FormulaireTache from './FormulaireTache'
import ReportTache from './ReportTache'
import type { TacheAffichee } from './taches'

/**
 * Les gestes sur une tâche affichée et les fenêtres qu'ils ouvrent : cocher (boucle de
 * relance si la tâche est liée à un contact, sinon faite en un geste), reporter, ouvrir pour
 * modifier, rouvrir. Commun à la liste des tâches et aux blocs de l'écran Aujourd'hui.
 * L'écran qui s'en sert affiche `fenetres` une fois, sous sa liste.
 */
export function useGestesTache(options: {
  aujourdhui: string
  /** Lien que le formulaire ne laisse pas changer (fiche Contact ou Bien). */
  verrouiller?: 'contact' | 'bien'
  /** Appelé après chaque geste : la liste doit se relire. */
  onChangement: () => void
}): {
  occupee: string | null
  cocher: (affichee: TacheAffichee) => void
  reporter: (affichee: TacheAffichee) => void
  ouvrir: (affichee: TacheAffichee) => void
  rouvrir: (affichee: TacheAffichee) => void
  fenetres: ReactNode
} {
  const { aujourdhui, verrouiller, onChangement } = options
  const actions = useActionsTache(onChangement)
  const [aReporter, setAReporter] = useState<TacheAffichee | null>(null)
  const [ouverte, setOuverte] = useState<TacheAffichee | null>(null)
  const [aBoucler, setABoucler] = useState<TacheAffichee | null>(null)

  function cocher(affichee: TacheAffichee) {
    if (affichee.contact !== null) setABoucler(affichee)
    else void actions.cocher(affichee.tache, aujourdhui)
  }

  const fenetres = (
    <>
      {aReporter !== null && (
        <ReportTache
          tache={aReporter.tache}
          aujourdhui={aujourdhui}
          envoi={actions.occupee === aReporter.id}
          onFermer={() => setAReporter(null)}
          onReporter={(echeance) => {
            void actions.reporter(aReporter.tache, echeance, aujourdhui).then((reussi) => {
              if (reussi) setAReporter(null)
            })
          }}
        />
      )}

      {ouverte !== null && (
        <FormulaireTache
          aujourdhui={aujourdhui}
          affichee={ouverte}
          verrouiller={verrouiller}
          onFermer={() => setOuverte(null)}
          onChangement={onChangement}
          onBoucler={() => {
            setABoucler(ouverte)
            setOuverte(null)
          }}
        />
      )}

      {aBoucler !== null && aBoucler.contact !== null && (
        <BoucleRelance
          tache={aBoucler.tache}
          contact={aBoucler.contact}
          aujourdhui={aujourdhui}
          onFermer={() => setABoucler(null)}
          onChangement={onChangement}
        />
      )}
    </>
  )

  return {
    occupee: actions.occupee,
    cocher,
    reporter: setAReporter,
    ouvrir: setOuverte,
    rouvrir: (affichee) => void actions.rouvrir(affichee.tache),
    fenetres,
  }
}
