import { useState } from 'react'
import Etiquette from '../../components/Etiquette'
import Icone from '../../components/Icone'
import { adresseBien } from '../biens/biens'
import { nomComplet } from '../contacts/contacts'
import {
  horaireActivite,
  iconeTypeActivite,
  libelleTypeActivite,
  lignesCompteRenduVisite,
  parJour,
  type ActiviteAffichee,
} from './activites'
import FormulaireActivite from './FormulaireActivite'
import { pastilleResultat, titreJourHistorique } from './historique'

type Props = {
  activites: readonly ActiviteAffichee[]
  aujourdhui: string
  /** Lien à ne pas répéter sur chaque carte, et à ne pas changer (la fiche affichée). */
  masquer?: 'contact' | 'bien'
  /** Appelé après une correction : l'historique se relit. */
  onChangement: () => void
}

/**
 * L'historique d'une fiche (étape D.6) : les activités groupées par jour (« Jeudi 13 novembre
 * · il y a 8 jours »), chacune en carte avec son dessin, son heure, son résultat en pastille
 * (« Pas de réponse », « Intéressé ») et son texte. Toucher une carte l'ouvre pour la corriger.
 */
export default function HistoriqueParJour({ activites, aujourdhui, masquer, onChangement }: Props) {
  const [ouverte, setOuverte] = useState<ActiviteAffichee | null>(null)

  return (
    <>
      <ol className="flex flex-col gap-5">
        {parJour(activites).map((jour) => (
          <li key={jour.date} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-encre-douce">
              {titreJourHistorique(jour.date, aujourdhui)}
            </h3>
            <ul className="flex flex-col gap-2">
              {jour.activites.map((affichee) => {
                const { activite, contact, bien } = affichee
                const pastille = pastilleResultat(activite)
                const liens = [
                  masquer === 'contact' || contact === null ? null : nomComplet(contact),
                  masquer === 'bien' || bien === null ? null : adresseBien(bien),
                ].filter((lien) => lien !== null)
                const visite = lignesCompteRenduVisite(activite)
                return (
                  <li key={affichee.id}>
                    <button
                      type="button"
                      onClick={() => setOuverte(affichee)}
                      className="flex w-full min-w-0 items-start gap-3 rounded-2xl bg-surface p-3 text-left ring-1 ring-bord hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-doux text-accent-fort">
                        <Icone nom={iconeTypeActivite(activite.type)} className="size-5" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-base font-semibold text-encre">
                            {libelleTypeActivite(activite.type)}
                          </span>
                          {pastille !== null && (
                            <Etiquette genre={pastille.genre}>{pastille.libelle}</Etiquette>
                          )}
                          <span className="ml-auto text-sm text-encre-douce tabular-nums">
                            {horaireActivite(activite)}
                          </span>
                        </span>
                        {liens.length > 0 && (
                          <span className="block truncate text-sm text-encre-douce">
                            {liens.join(' · ')}
                          </span>
                        )}
                        {visite.length > 0 && (
                          <span className="block text-sm text-encre">
                            {visite.map(([nom, valeur]) => (
                              <span key={nom} className="block break-words">
                                <span className="font-medium">{nom} :</span> {valeur}
                              </span>
                            ))}
                          </span>
                        )}
                        {activite.compte_rendu !== '' && (
                          <span className="line-clamp-6 block text-base break-words whitespace-pre-wrap text-encre">
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
