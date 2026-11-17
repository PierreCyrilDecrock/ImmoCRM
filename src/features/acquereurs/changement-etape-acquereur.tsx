import { useState, type ReactNode } from 'react'
import { useNotifications } from '../../components/notifications-contexte'
import { exigerSupabase } from '../../lib/supabase'
import FenetrePassageAcquereur from './FenetrePassageAcquereur'
import {
  informationsManquantesAcquereur,
  libelleEtapeAcquereur,
  type EtapeAcquereur,
} from './pipeline-acquereur'
import { changerEtapeAcquereur, type ProjetAcquereurAffiche } from './projets-acquereurs'

type Demande = { affiche: ProjetAcquereurAffiche; cible: EtapeAcquereur }

/**
 * Change l'étape d'un projet acquéreur, depuis le tableau (glisser-déposer) ou la fiche du
 * projet. Si rien ne manque (critères remplis, retour en arrière), c'est enregistré aussitôt ;
 * sinon une fenêtre demande ce qui manque. Renvoie `demander` et la fenêtre à placer.
 */
export function useChangementEtapeAcquereur(onChangement: () => void): {
  demander: (affiche: ProjetAcquereurAffiche, cible: EtapeAcquereur) => void
  enCours: string | null
  fenetre: ReactNode
} {
  const { notifier } = useNotifications()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null)

  async function enregistrerDirectement({ affiche, cible }: Demande) {
    setEnCours(affiche.id)
    const resultat = await changerEtapeAcquereur(exigerSupabase(), affiche.id, { etape: cible })
    setEnCours(null)
    if (!resultat.ok) {
      notifier('erreur', `Le changement d'étape a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', `Projet passé à l’étape « ${libelleEtapeAcquereur(cible)} »`)
    onChangement()
  }

  function demander(affiche: ProjetAcquereurAffiche, cible: EtapeAcquereur) {
    if (cible === affiche.projet.etape) return
    const manquantes = informationsManquantesAcquereur(affiche.projet, affiche.nbProposes, cible)
    if (manquantes.length === 0) void enregistrerDirectement({ affiche, cible })
    else setDemande({ affiche, cible })
  }

  return {
    demander,
    enCours,
    fenetre:
      demande === null ? null : (
        <FenetrePassageAcquereur
          key={`${demande.affiche.id}-${demande.cible}`}
          demande={demande}
          onFermer={() => setDemande(null)}
          onFait={() => {
            setDemande(null)
            onChangement()
          }}
        />
      ),
  }
}
