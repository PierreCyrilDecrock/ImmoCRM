import { useState, type ReactNode } from 'react'
import { useNotifications } from '../../components/notifications-contexte'
import { dateDuJour } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import FenetrePassage from './FenetrePassage'
import {
  brouillonPassage,
  informationsManquantes,
  libelleEtape,
  preparerPassage,
  type EtapeVendeur,
} from './pipeline-vendeur'
import { changerEtapeProjet, type ProjetVendeurAffiche } from './projets-vendeurs'

type Demande = { affiche: ProjetVendeurAffiche; cible: EtapeVendeur }

/**
 * Change l'étape d'un projet, depuis le tableau (glisser-déposer) ou la fiche du projet.
 * Si le passage ne demande rien de plus (critères déjà remplis, retour en arrière), il est
 * enregistré aussitôt ; sinon une fenêtre demande les informations qui manquent.
 * Renvoie `demander` et la fenêtre à placer dans la page.
 */
export function useChangementEtape(onChangement: () => void): {
  demander: (affiche: ProjetVendeurAffiche, cible: EtapeVendeur) => void
  enCours: string | null
  fenetre: ReactNode
} {
  const { notifier } = useNotifications()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null)

  async function enregistrerDirectement({ affiche, cible }: Demande) {
    const aujourdhui = dateDuJour()
    const preparation = preparerPassage(
      affiche.projet,
      affiche.contact?.source ?? null,
      cible,
      brouillonPassage(affiche.projet, aujourdhui),
      aujourdhui,
    )
    if (!preparation.ok) {
      setDemande({ affiche, cible })
      return
    }
    setEnCours(affiche.id)
    const resultat = await changerEtapeProjet(
      exigerSupabase(),
      affiche.projet,
      preparation.passage,
      affiche.bien,
    )
    setEnCours(null)
    if (!resultat.ok) {
      notifier('erreur', `Le changement d'étape a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', `Projet passé à l’étape « ${libelleEtape(cible)} »`)
    onChangement()
  }

  function demander(affiche: ProjetVendeurAffiche, cible: EtapeVendeur) {
    if (cible === affiche.projet.etape) return
    const manquantes = informationsManquantes(
      affiche.projet,
      affiche.contact?.source ?? null,
      cible,
    )
    if (manquantes.length === 0) void enregistrerDirectement({ affiche, cible })
    else setDemande({ affiche, cible })
  }

  return {
    demander,
    enCours,
    fenetre:
      demande === null ? null : (
        <FenetrePassage
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
