import { useId, useRef } from 'react'
import { masqueFondu, useSuitesCachees } from '../../components/defilement'
import Pastille from '../../components/Pastille'
import type { TypeActivite } from './activites'
import type { PastilleType } from './historique'

type Props = {
  /** Les pastilles (`pastillesTypes`) : « Tout », puis les types présents. */
  pastilles: readonly PastilleType[]
  valeur: TypeActivite | ''
  onChange: (valeur: TypeActivite | '') => void
  /**
   * Ce qui borde la rangée à droite : la carte (`carte`, l'historique d'une fiche) ou la page
   * (`page`, le journal). La rangée va jusqu'à ce bord, où se pose le fondu.
   */
  bord?: 'carte' | 'page'
}

const BORDS = {
  carte: { dehors: '-mr-4 md:-mr-5', dedans: 'pr-4 md:pr-5' },
  page: { dehors: '-mr-4 md:-mr-8', dedans: 'pr-4 md:pr-8' },
}

/**
 * Le filtre par type d'un historique ou du journal (revue de design n° 2, proposition 13) :
 * sa légende « Afficher », puis une rangée de pastilles qui défile de côté (« Tout 12 »,
 * « Appels 3 »…), un fondu signalant la suite. Le choix s'applique d'un toucher.
 */
export default function FiltreTypes({ pastilles, valeur, onChange, bord = 'carte' }: Props) {
  const id = useId()
  const rangee = useRef<HTMLDivElement>(null)
  const masque = masqueFondu(useSuitesCachees(rangee))
  return (
    <div role="group" aria-labelledby={id} className="flex min-w-0 items-center gap-2">
      <span id={id} className="shrink-0 text-sm font-medium text-encre">
        Afficher
      </span>
      {/* Jusqu'au bord de la carte : le fondu s'y pose, la dernière pastille garde sa marge. */}
      <div className={`min-w-0 flex-1 ${BORDS[bord].dehors}`}>
        <div
          ref={rangee}
          className={`flex gap-2 overflow-x-auto ${BORDS[bord].dedans}`}
          style={masque === undefined ? undefined : { maskImage: masque, WebkitMaskImage: masque }}
        >
          {pastilles.map((pastille) => {
            const choisie = pastille.valeur === valeur
            return (
              <span key={pastille.valeur} className="shrink-0">
                <Pastille choisie={choisie} onClick={() => onChange(pastille.valeur)}>
                  <span aria-hidden="true" className="whitespace-nowrap">
                    {pastille.libelle}
                    {pastille.nombre !== null && (
                      <span
                        className={`ml-1.5 tabular-nums ${choisie ? 'opacity-75' : 'text-encre-douce'}`}
                      >
                        {pastille.nombre}
                      </span>
                    )}
                  </span>
                  <span className="sr-only">{pastille.annonce}</span>
                </Pastille>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
