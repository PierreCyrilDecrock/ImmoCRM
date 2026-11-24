import type { Vue } from './echeances'
import { useGestesTache } from './gestes-tache'
import { jourDeLaVue } from './ligne-tache'
import LigneTache from './LigneTache'
import type { TacheAffichee } from './taches'

type Props = {
  taches: readonly TacheAffichee[]
  aujourdhui: string
  /** Lien à ne pas répéter sur chaque ligne, et à ne pas changer (fiche Contact ou Bien). */
  masquer?: 'contact' | 'bien'
  /** L'onglet affiché (page Tâches) : son jour ne se répète pas sur chaque ligne. */
  vue?: Vue
  /** Appelé après chaque geste : la liste doit se relire. */
  onChangement: () => void
}

/**
 * Liste de tâches avec leurs gestes : cocher, reporter, ouvrir pour modifier, rouvrir.
 * Sert à la page Tâches et aux rubriques Tâches des fiches. Cocher une tâche liée à un
 * contact ouvre la boucle de relance (résultat, compte rendu, prochaine action) ; une tâche
 * sans contact est faite en un geste. Chaque ligne se reporte en un geste (derrière le bouton
 * horloge sur écran tactile, au survol sur ordinateur) et se glisse au doigt.
 */
export default function ListeTaches({ taches, aujourdhui, masquer, vue, onChangement }: Props) {
  const gestes = useGestesTache({ aujourdhui, verrouiller: masquer, onChangement })
  const jourMasque = jourDeLaVue(vue, aujourdhui)

  return (
    <>
      <ul className="divide-y divide-bord">
        {taches.map((affichee) => (
          <LigneTache
            key={affichee.id}
            affichee={affichee}
            aujourdhui={aujourdhui}
            masquer={masquer}
            jourMasque={jourMasque}
            occupee={gestes.occupee === affichee.id}
            onCocher={() => gestes.cocher(affichee)}
            onReporter={() => gestes.reporter(affichee)}
            onOuvrir={() => gestes.ouvrir(affichee)}
            onRouvrir={() => gestes.rouvrir(affichee)}
            onReporterA={(echeance) => gestes.reporterA(affichee, echeance)}
          />
        ))}
      </ul>
      {gestes.fenetres}
    </>
  )
}
