import { useState } from 'react'
import Icone from '../../components/Icone'
import { adresseBien } from '../biens/biens'
import { nomComplet } from '../contacts/contacts'
import {
  horaireActivite,
  iconeTypeActivite,
  lignesCompteRenduVisite,
  parJour,
  titreActivite,
  type ActiviteAffichee,
} from './activites'
import FormulaireActivite from './FormulaireActivite'
import { libelleJourActivite } from './periodes'

type Props = {
  activites: readonly ActiviteAffichee[]
  aujourdhui: string
  /** Lien à ne pas répéter sur chaque ligne, et à ne pas changer (fiche Contact ou Bien). */
  masquer?: 'contact' | 'bien'
  /** Appelé après une modification : le fil doit se relire. */
  onChangement: () => void
}

/**
 * Fil chronologique du journal, du plus récent au plus ancien, jour par jour. Toucher une
 * activité l'ouvre pour la corriger. Sert aux fiches Contact et Bien et à la page Journal.
 */
export default function FilActivites({ activites, aujourdhui, masquer, onChangement }: Props) {
  const [ouverte, setOuverte] = useState<ActiviteAffichee | null>(null)

  return (
    <>
      <ol className="flex flex-col gap-3">
        {parJour(activites).map((jour) => (
          <li key={jour.date}>
            <h3 className="px-4 pb-1 text-sm font-semibold text-encre-douce">
              {libelleJourActivite(jour.date, aujourdhui)}
            </h3>
            <ul className="divide-y divide-bord">
              {jour.activites.map((affichee) => {
                const { activite, contact, bien } = affichee
                const liens = [
                  masquer === 'contact' || contact === null ? null : nomComplet(contact),
                  masquer === 'bien' || bien === null ? null : adresseBien(bien),
                ].filter((lien) => lien !== null)
                return (
                  <li key={affichee.id}>
                    <button
                      type="button"
                      onClick={() => setOuverte(affichee)}
                      className="flex w-full min-w-0 items-start gap-3 px-4 py-3 text-left hover:bg-creux focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-doux text-accent-fort">
                        <Icone nom={iconeTypeActivite(activite.type)} className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="text-base font-medium text-encre">
                            {titreActivite(activite)}
                          </span>
                          <span className="text-sm text-encre-douce">
                            {horaireActivite(activite)}
                          </span>
                        </span>
                        {liens.length > 0 && (
                          <span className="block truncate text-sm text-encre-douce">
                            {liens.join(' · ')}
                          </span>
                        )}
                        {lignesCompteRenduVisite(activite).length > 0 && (
                          <span className="mt-1 block text-sm text-encre">
                            {lignesCompteRenduVisite(activite).map(([nom, valeur]) => (
                              <span key={nom} className="block break-words">
                                <span className="font-medium">{nom} :</span> {valeur}
                              </span>
                            ))}
                          </span>
                        )}
                        {activite.compte_rendu !== '' && (
                          <span className="mt-1 line-clamp-4 block text-base break-words whitespace-pre-wrap text-encre">
                            {activite.compte_rendu}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>

      {ouverte !== null && (
        <FormulaireActivite
          affichee={ouverte}
          verrouiller={masquer}
          onFermer={() => setOuverte(null)}
          onChangement={onChangement}
        />
      )}
    </>
  )
}
