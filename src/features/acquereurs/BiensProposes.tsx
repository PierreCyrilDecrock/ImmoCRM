import { useState } from 'react'
import { Link } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import Carte from '../../components/Carte'
import ChampSaisie from '../../components/ChampSaisie'
import Etiquette from '../../components/Etiquette'
import FenetreModale from '../../components/FenetreModale'
import Pastille from '../../components/Pastille'
import { useNotifications } from '../../components/notifications-contexte'
import { formaterDate } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import { adresseBien, resumeBien, type Bien } from '../biens/biens'
import SelecteurBien from '../biens/SelecteurBien'
import {
  changerReaction,
  genreReaction,
  libelleReaction,
  LONGUEUR_MAX_RAISON_REFUS,
  preparerReaction,
  proposerBien,
  REACTIONS,
  retirerBienPropose,
  type BienProposeAffiche,
  type Reaction,
} from './biens-proposes'
import PlanifierVisite from './PlanifierVisite'
import { CLASSES_LIEN } from '../contacts/coordonnees'

type Props = {
  projetId: string
  proposes: readonly BienProposeAffiche[]
  /** Projet hors du pipeline ou archivé : la sélection se consulte seulement. */
  lectureSeule: boolean
  onChangement: () => void
}

/**
 * Rubrique « Biens proposés » d'un projet acquéreur : la sélection, la réaction de
 * l'acquéreur à chaque bien (intéressé, à visiter, refusé avec la raison), l'ajout d'un bien
 * et la planification d'une visite.
 */
export default function BiensProposes({ projetId, proposes, lectureSeule, onChangement }: Props) {
  const { notifier } = useNotifications()
  const [ajout, setAjout] = useState(false)
  const [occupe, setOccupe] = useState<string | null>(null)
  const [refus, setRefus] = useState<{ id: string; raison: string; erreur?: string } | null>(null)
  const [retrait, setRetrait] = useState<BienProposeAffiche | null>(null)
  const [visite, setVisite] = useState<{ bien: Bien | null } | null>(null)

  async function proposer(bien: Bien) {
    setAjout(false)
    setOccupe('ajout')
    const resultat = await proposerBien(exigerSupabase(), projetId, bien.id)
    setOccupe(null)
    if (!resultat.ok) {
      notifier('erreur', `Le bien n'a pas pu être ajouté. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', `Bien proposé : ${bien.adresse}`)
    onChangement()
  }

  async function reagir(id: string, reaction: Reaction | null, raison = '') {
    const preparation = preparerReaction(reaction, raison)
    if (!preparation.ok) {
      setRefus((actuel) => (actuel === null ? null : { ...actuel, erreur: preparation.erreur }))
      return
    }
    setOccupe(id)
    const resultat = await changerReaction(exigerSupabase(), id, preparation.valeurs)
    setOccupe(null)
    setRefus(null)
    if (!resultat.ok) {
      notifier('erreur', `La réaction n'a pas pu être notée. ${resultat.erreur.message}`)
      return
    }
    onChangement()
  }

  async function retirer(affiche: BienProposeAffiche) {
    setOccupe(affiche.id)
    const resultat = await retirerBienPropose(exigerSupabase(), affiche.id)
    setOccupe(null)
    setRetrait(null)
    if (!resultat.ok) {
      notifier('erreur', `Le retrait a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Bien retiré de la sélection')
    onChangement()
  }

  return (
    <Carte titre={`Biens proposés${proposes.length === 0 ? '' : ` · ${proposes.length}`}`}>
      {proposes.length === 0 ? (
        <p className="text-sm text-encre-douce">
          Aucun bien proposé. Les biens envoyés à l'acquéreur s'ajoutent ici, avec sa réaction.
        </p>
      ) : (
        <ul className="-mx-4 divide-y divide-bord">
          {proposes.map((affiche) => {
            const { propose, bien } = affiche
            return (
              <li key={affiche.id} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    {bien === null ? (
                      <span className="text-encre">Bien introuvable</span>
                    ) : (
                      <Link to={`/biens/${bien.id}`} className={`${CLASSES_LIEN} break-words`}>
                        {adresseBien(bien)}
                      </Link>
                    )}
                    <span className="block text-sm text-encre-douce">
                      {[
                        bien === null ? '' : resumeBien(bien),
                        `proposé le ${formaterDate(propose.propose_le)}`,
                      ]
                        .filter((morceau) => morceau !== '')
                        .join(' · ')}
                    </span>
                    {propose.reaction === 'refuse' && propose.raison_refus !== '' && (
                      <span className="block text-sm break-words text-encre">
                        Refusé : {propose.raison_refus}
                      </span>
                    )}
                  </div>
                  <Etiquette genre={genreReaction(propose.reaction)}>
                    {libelleReaction(propose.reaction)}
                  </Etiquette>
                </div>
                {!lectureSeule && (
                  <div className="flex flex-wrap items-center gap-2">
                    {REACTIONS.map((option) => (
                      <Pastille
                        key={option.valeur}
                        choisie={propose.reaction === option.valeur}
                        onClick={() => {
                          if (occupe !== null) return
                          if (option.valeur === 'refuse') {
                            setRefus({ id: affiche.id, raison: propose.raison_refus })
                          } else {
                            void reagir(
                              affiche.id,
                              propose.reaction === option.valeur ? null : option.valeur,
                            )
                          }
                        }}
                      >
                        {option.libelle}
                      </Pastille>
                    ))}
                    {propose.reaction !== 'refuse' && bien !== null && (
                      <Bouton
                        variante="discret"
                        icone="horloge"
                        onClick={() => setVisite({ bien })}
                      >
                        Planifier une visite
                      </Bouton>
                    )}
                    <Bouton variante="discret" onClick={() => setRetrait(affiche)}>
                      Retirer
                    </Bouton>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {!lectureSeule && (
        <div className="mt-3 flex flex-col gap-3">
          {ajout ? (
            <>
              <SelecteurBien libelle="Chercher le bien à proposer" autoFocus onChoisir={proposer} />
              <div>
                <Bouton variante="discret" onClick={() => setAjout(false)}>
                  Fermer la recherche
                </Bouton>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Bouton
                variante="secondaire"
                icone="ajouter"
                disabled={occupe === 'ajout'}
                onClick={() => setAjout(true)}
              >
                Proposer un bien
              </Bouton>
              <Bouton
                variante="secondaire"
                icone="horloge"
                onClick={() => setVisite({ bien: null })}
              >
                Planifier une visite
              </Bouton>
            </div>
          )}
        </div>
      )}

      {refus !== null && (
        <FenetreModale
          ouverte
          titre="Bien refusé"
          onFermer={() => setRefus(null)}
          pied={
            <>
              <Bouton
                pleineLargeur
                disabled={occupe !== null}
                onClick={() => void reagir(refus.id, 'refuse', refus.raison)}
              >
                Enregistrer
              </Bouton>
              <Bouton variante="secondaire" pleineLargeur onClick={() => setRefus(null)}>
                Annuler
              </Bouton>
            </>
          }
        >
          <ChampSaisie
            libelle="Pourquoi ? (facultatif)"
            autoFocus
            autoComplete="off"
            maxLength={LONGUEUR_MAX_RAISON_REFUS}
            placeholder="Trop de travaux, pas de jardin, quartier…"
            value={refus.raison}
            onChange={(evenement) => setRefus({ ...refus, raison: evenement.target.value })}
            erreur={refus.erreur}
            aide="La raison affine la recherche : elle reste sur la fiche du projet."
          />
        </FenetreModale>
      )}

      <FenetreModale
        ouverte={retrait !== null}
        titre="Retirer ce bien de la sélection ?"
        onFermer={() => setRetrait(null)}
        pied={
          <>
            <Bouton
              pleineLargeur
              disabled={occupe !== null}
              onClick={() => retrait !== null && void retirer(retrait)}
            >
              Retirer
            </Bouton>
            <Bouton variante="secondaire" pleineLargeur onClick={() => setRetrait(null)}>
              Annuler
            </Bouton>
          </>
        }
      >
        <p className="text-base text-encre">
          À réserver à un bien proposé par erreur. Un bien qui ne plaît pas se marque plutôt «
          Refusé » : la raison aide à affiner la recherche.
        </p>
      </FenetreModale>

      {visite !== null && (
        <PlanifierVisite
          projetId={projetId}
          proposes={proposes}
          bien={visite.bien}
          onFermer={() => setVisite(null)}
          onFait={() => {
            setVisite(null)
            onChangement()
          }}
        />
      )}
    </Carte>
  )
}
