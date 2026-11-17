import { useState, type FormEvent } from 'react'
import Bouton from '../../components/Bouton'
import ChampChoix from '../../components/ChampChoix'
import ChampSaisie from '../../components/ChampSaisie'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import { useNotifications } from '../../components/notifications-contexte'
import { dateDuJour } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import { adresseBien } from '../biens/biens'
import type { BienProposeAffiche } from './biens-proposes'
import { preparerOffre, type BrouillonOffre, type ErreursOffre } from './pipeline-acquereur'
import { accepterOffre } from './projets-acquereurs'

type Props = {
  projetId: string
  /** La sélection du projet : l'offre porte sur l'un de ces biens. */
  proposes: readonly BienProposeAffiche[]
  nbVisites: number
  onFermer: () => void
  onFait: () => void
}

/**
 * L'offre de l'acquéreur est acceptée : le projet est gagné. Le dossier de vente lui-même
 * (compromis, financement, acte) viendra avec le pipeline transaction, en version 2.
 */
export default function OffreAcceptee({ projetId, proposes, nbVisites, onFermer, onFait }: Props) {
  const { notifier } = useNotifications()
  const aujourdhui = dateDuJour()
  const options = proposes
    .filter((p) => p.bien !== null && p.propose.reaction !== 'refuse')
    .map((p) => ({
      valeur: p.propose.bien_id,
      libelle: p.bien === null ? '' : adresseBien(p.bien),
    }))
  const [saisie, setSaisie] = useState<BrouillonOffre>({
    bienId: options.length === 1 ? (options[0]?.valeur ?? '') : '',
    offreLe: aujourdhui,
  })
  const [erreurs, setErreurs] = useState<ErreursOffre>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerOffre(saisie, { aujourdhui, nbVisites })
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await accepterOffre(exigerSupabase(), projetId, preparation.valeurs)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Offre acceptée : le projet est gagné')
    onFait()
  }

  return (
    <FenetreModale
      ouverte
      titre="Offre acceptée"
      onFermer={onFermer}
      pied={
        <>
          <Bouton
            type="submit"
            form="offre-acceptee"
            pleineLargeur
            disabled={envoi || nbVisites === 0}
          >
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="offre-acceptee"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}
        {(nbVisites === 0 || erreurs.visites !== undefined) && (
          <Message genre="info">
            Aucune visite n'est consignée pour ce projet. Le critère des visites, ce sont leurs
            comptes rendus : clôturez d'abord une visite, ou consignez-la au journal du projet.
          </Message>
        )}
        <ChampChoix
          libelle="Bien de l'offre"
          options={options}
          optionVide="Choisir…"
          value={saisie.bienId}
          onChange={(evenement) =>
            setSaisie((actuelle) => ({ ...actuelle, bienId: evenement.target.value }))
          }
          erreur={erreurs.bienId}
        />
        <ChampSaisie
          libelle="Acceptée le"
          type="date"
          max={aujourdhui}
          value={saisie.offreLe}
          onChange={(evenement) =>
            setSaisie((actuelle) => ({ ...actuelle, offreLe: evenement.target.value }))
          }
          erreur={erreurs.offreLe}
          aide="Le suivi du dossier (compromis, financement, acte) viendra avec les transactions."
        />
      </form>
    </FenetreModale>
  )
}
