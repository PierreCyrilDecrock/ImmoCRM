import { useState } from 'react'
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
  /**
   * Version courte (bloc « Consigner un échange » d'une fiche) : le titre et la date en
   * texte, les raccourcis de date ; le titre et le calendrier se déplient par « Autre ».
   */
  compacte?: boolean
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
  compacte = false,
}: Props) {
  const [detail, setDetail] = useState(false)
  const affichee = prochaineAffichee(brouillon, proposee)
  const changer = (valeurs: Partial<BrouillonProchaine>) => onChange({ ...brouillon, ...valeurs })

  if (brouillon.mode === 'deja_prevue' && dejaPrevu !== undefined) {
    return (
      <div className="flex flex-col gap-2">
        <Message genre="info">Déjà prévu : {dejaPrevu}.</Message>
        <div className="-ml-2 self-start">
          {/* En gris : un geste rare, qui ne concurrence pas « Enregistrer ». */}
          <Bouton variante="sobre" icone="ajouter" onClick={() => changer({ mode: 'planifier' })}>
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

  const titre = (
    <ChampSaisie
      libelle="À faire"
      maxLength={LONGUEURS_MAX_TACHE.titre}
      enterKeyHint="done"
      value={affichee.titre}
      onChange={(evenement) => changer({ titre: evenement.target.value })}
      erreur={erreurs.titre}
    />
  )
  const raccourcis = RACCOURCIS_RELANCE.map((code) => {
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
  })
  const calendrier = (
    <ChampSaisie
      libelle="Ou le"
      type="date"
      min={aujourdhui}
      value={affichee.echeance}
      onChange={(evenement) => changer({ echeance: evenement.target.value })}
      aide={aideDate}
      erreur={erreurs.echeance}
    />
  )
  const rienPrevoir = (
    <div className="-ml-2 self-start">
      <Bouton
        variante="discret"
        onClick={() => changer({ mode: dejaPrevu === undefined ? 'aucune' : 'deja_prevue' })}
      >
        {dejaPrevu === undefined ? 'Ne rien prévoir' : 'Ne rien ajouter'}
      </Bouton>
    </div>
  )

  if (compacte) {
    // Une erreur déplie le titre et le calendrier, pour qu'elle se voie.
    const deplie = detail || erreurs.titre !== undefined || erreurs.echeance !== undefined
    return (
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-base font-medium break-words text-encre">{affichee.titre}</p>
          <p className="text-sm text-encre-douce">{aideDate}</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date de la prochaine action">
          {raccourcis}
          <button
            type="button"
            aria-expanded={deplie}
            onClick={() => setDetail(!deplie)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-accent ring-1 ring-bord-fort/40 ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Modifier
          </button>
        </div>
        {deplie && (
          <div className="grid gap-4 md:grid-cols-2">
            {titre}
            {calendrier}
          </div>
        )}
        {rienPrevoir}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {titre}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-encre">Dans</legend>
        <div className="flex flex-wrap gap-2">{raccourcis}</div>
      </fieldset>
      {calendrier}
      {rienPrevoir}
    </div>
  )
}
