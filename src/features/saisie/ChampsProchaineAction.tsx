import Bouton from '../../components/Bouton'
import ChampSaisie from '../../components/ChampSaisie'
import Message from '../../components/Message'
import Pastille from '../../components/Pastille'
import { ajouterDelai, libelleDelai, RACCOURCIS_RELANCE } from '../relances/delais'
import { libelleJour } from '../taches/echeances'
import { LONGUEURS_MAX_TACHE } from '../taches/taches'
import {
  prochaineAffichee,
  type BrouillonProchaine,
  type ErreursProchaine,
  type ProchaineProposee,
} from './prochaine-action'

type Props = {
  brouillon: BrouillonProchaine
  proposee: ProchaineProposee
  onChange: (brouillon: BrouillonProchaine) => void
  aujourdhui: string
  erreurs: ErreursProchaine
  /** D'où vient la date proposée (« rythme d'un contact tiède »). */
  origineDate: string
  /** Ce qui est déjà prévu pour le contact, s'il y a lieu (« Relancer, le 20 novembre »). */
  dejaPrevu?: string
}

/**
 * La prochaine action d'une saisie express : un titre et une date déjà proposés, des
 * raccourcis de date d'un toucher. « Ne rien prévoir » reste possible : le contact rejoint
 * alors les « sans prochaine action » de l'écran Aujourd'hui.
 */
export default function ChampsProchaineAction({
  brouillon,
  proposee,
  onChange,
  aujourdhui,
  erreurs,
  origineDate,
  dejaPrevu,
}: Props) {
  const affichee = prochaineAffichee(brouillon, proposee)
  const changer = (valeurs: Partial<BrouillonProchaine>) => onChange({ ...brouillon, ...valeurs })

  if (brouillon.mode === 'deja_prevue' && dejaPrevu !== undefined) {
    return (
      <div className="flex flex-col gap-2">
        <Message genre="info">Déjà prévu : {dejaPrevu}.</Message>
        <div className="-ml-2 self-start">
          <Bouton variante="discret" icone="ajouter" onClick={() => changer({ mode: 'planifier' })}>
            Ajouter une relance quand même
          </Bouton>
        </div>
      </div>
    )
  }

  if (brouillon.mode === 'aucune') {
    return (
      <div className="flex flex-col gap-2 rounded-2xl bg-alerte-doux p-3">
        <p className="text-sm text-encre">
          Rien ne sera prévu : le contact apparaîtra dans les alertes « sans prochaine action » de
          l’écran Aujourd’hui.
        </p>
        <div className="-ml-2 self-start">
          <Bouton variante="discret" onClick={() => changer({ mode: 'planifier' })}>
            Prévoir une relance
          </Bouton>
        </div>
      </div>
    )
  }

  const aideDate =
    brouillon.echeance === null
      ? `${libelleJour(affichee.echeance, aujourdhui)} : ${origineDate}.`
      : libelleJour(affichee.echeance, aujourdhui)

  return (
    <div className="flex flex-col gap-4">
      <ChampSaisie
        libelle="À faire"
        maxLength={LONGUEURS_MAX_TACHE.titre}
        enterKeyHint="done"
        value={affichee.titre}
        onChange={(evenement) => changer({ titre: evenement.target.value })}
        erreur={erreurs.titre}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-encre">Dans</legend>
        <div className="flex flex-wrap gap-2">
          {RACCOURCIS_RELANCE.map((code) => {
            const date = ajouterDelai(aujourdhui, code) ?? ''
            return (
              <Pastille
                key={code}
                choisie={affichee.echeance === date}
                onClick={() => changer({ echeance: date })}
              >
                {libelleDelai(code)}
              </Pastille>
            )
          })}
        </div>
      </fieldset>
      <ChampSaisie
        libelle="Ou le"
        type="date"
        min={aujourdhui}
        value={affichee.echeance}
        onChange={(evenement) => changer({ echeance: evenement.target.value })}
        aide={aideDate}
        erreur={erreurs.echeance}
      />
      <div className="-ml-2 self-start">
        <Bouton
          variante="discret"
          onClick={() => changer({ mode: dejaPrevu === undefined ? 'aucune' : 'deja_prevue' })}
        >
          {dejaPrevu === undefined ? 'Ne rien prévoir' : 'Ne rien ajouter'}
        </Bouton>
      </div>
    </div>
  )
}
