import { useGestesTache } from './gestes-tache'
import LigneTache from './LigneTache'
import type { TacheAffichee } from './taches'

type Props = {
  taches: readonly TacheAffichee[]
  aujourdhui: string
  /** Lien à ne pas répéter sur chaque ligne, et à ne pas changer (fiche Contact ou Bien). */
  masquer?: 'contact' | 'bien'
  /** Appelé après chaque geste : la liste doit se relire. */
  onChangement: () => void
  /** Reports en un geste et lignes glissables (page Tâches). */
  gestesRapides?: boolean
}

/**
 * Liste de tâches avec leurs gestes : cocher, reporter, ouvrir pour modifier, rouvrir.
 * Sert à la page Tâches, aux rubriques Tâches des fiches et au bloc Tâches de l'écran
 * Aujourd'hui. Cocher une tâche liée à un contact ouvre la boucle de relance (résultat,
 * compte rendu, prochaine action) ; une tâche sans contact est faite en un geste. Avec
 * `gestesRapides`, chaque ligne se reporte en un geste et se glisse au doigt.
 */
export default function ListeTaches({
  taches,
  aujourdhui,
  masquer,
  onChangement,
  gestesRapides = false,
}: Props) {
  const gestes = useGestesTache({ aujourdhui, verrouiller: masquer, onChangement })

  return (
    <>
      <ul className="divide-y divide-bord">
        {taches.map((affichee) => (
          <LigneTache
            key={affichee.id}
            affichee={affichee}
            aujourdhui={aujourdhui}
            masquer={masquer}
            occupee={gestes.occupee === affichee.id}
            onCocher={() => gestes.cocher(affichee)}
            onReporter={() => gestes.reporter(affichee)}
            onOuvrir={() => gestes.ouvrir(affichee)}
            onRouvrir={() => gestes.rouvrir(affichee)}
            onReporterA={
              gestesRapides ? (echeance) => gestes.reporterA(affichee, echeance) : undefined
            }
          />
        ))}
      </ul>
      {gestes.fenetres}
    </>
  )
}
