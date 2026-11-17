import { useState } from 'react'
import BoucleRelance from '../relances/BoucleRelance'
import { useActionsTache } from './actions-tache'
import FormulaireTache from './FormulaireTache'
import LigneTache from './LigneTache'
import ReportTache from './ReportTache'
import type { TacheAffichee } from './taches'

type Props = {
  taches: readonly TacheAffichee[]
  aujourdhui: string
  /** Lien à ne pas répéter sur chaque ligne, et à ne pas changer (fiche Contact ou Bien). */
  masquer?: 'contact' | 'bien'
  /** Appelé après chaque geste : la liste doit se relire. */
  onChangement: () => void
}

/**
 * Liste de tâches avec leurs gestes : cocher, reporter, ouvrir pour modifier, rouvrir.
 * Sert à la page Tâches et aux rubriques Tâches des fiches. Cocher une tâche liée à un
 * contact ouvre la boucle de relance (résultat, compte rendu, prochaine action) ; une tâche
 * sans contact est faite en un geste.
 */
export default function ListeTaches({ taches, aujourdhui, masquer, onChangement }: Props) {
  const actions = useActionsTache(onChangement)
  const [aReporter, setAReporter] = useState<TacheAffichee | null>(null)
  const [ouverte, setOuverte] = useState<TacheAffichee | null>(null)
  const [aBoucler, setABoucler] = useState<TacheAffichee | null>(null)

  function cocher(affichee: TacheAffichee) {
    if (affichee.contact !== null) setABoucler(affichee)
    else void actions.cocher(affichee.tache, aujourdhui)
  }

  return (
    <>
      <ul className="divide-y divide-bord">
        {taches.map((affichee) => (
          <LigneTache
            key={affichee.id}
            affichee={affichee}
            aujourdhui={aujourdhui}
            masquer={masquer}
            occupee={actions.occupee === affichee.id}
            onCocher={() => cocher(affichee)}
            onReporter={() => setAReporter(affichee)}
            onOuvrir={() => setOuverte(affichee)}
            onRouvrir={() => void actions.rouvrir(affichee.tache)}
          />
        ))}
      </ul>

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
          verrouiller={masquer}
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
}
