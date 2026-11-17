import { useState } from 'react'
import { useNotifications } from '../../components/notifications-contexte'
import { formaterJourCourt } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import { libelleVue, vueDe } from './echeances'
import { cloturerTache, reporterTache, rouvrirTache, type Tache } from './taches'

/** Où retrouver une tâche à faire : « jeu. 19 nov., dans « Cette semaine » ». */
function ouRetrouver(echeance: string, aujourdhui: string): string {
  return `${formaterJourCourt(echeance, aujourdhui)}, dans « ${libelleVue(vueDe(echeance, aujourdhui))} »`
}

/**
 * Les gestes sur une tâche, communs à la page Tâches et aux fiches : cocher, reporter,
 * annuler, rouvrir. Chacun annonce son résultat, puis appelle `onChangement` pour que la
 * liste se relise. Renvoie `true` si l'action a réussi.
 */
export function useActionsTache(onChangement: () => void) {
  const { notifier } = useNotifications()
  /** Identifiant de la tâche en cours de traitement. */
  const [occupee, setOccupee] = useState<string | null>(null)

  async function executer(id: string, action: () => Promise<string | null>): Promise<boolean> {
    setOccupee(id)
    const echec = await action()
    setOccupee(null)
    if (echec !== null) {
      notifier('erreur', echec)
      return false
    }
    onChangement()
    return true
  }

  function cloturer(
    tache: Tache,
    aujourdhui: string,
    etat: 'faite' | 'annulee',
    arreterSerie = false,
  ): Promise<boolean> {
    return executer(tache.id, async () => {
      const resultat = await cloturerTache(exigerSupabase(), tache, {
        etat,
        aujourdhui,
        arreterSerie,
      })
      if (!resultat.ok) return `L'action a échoué. ${resultat.erreur.message}`
      const faite = etat === 'faite' ? 'Tâche faite' : 'Tâche annulée'
      const suivante = resultat.donnees
      notifier(
        'succes',
        suivante === null
          ? faite
          : `${faite}. Prochaine fois : ${ouRetrouver(suivante.echeance, aujourdhui)}.`,
      )
      return null
    })
  }

  return {
    occupee,
    cocher: (tache: Tache, aujourdhui: string) => cloturer(tache, aujourdhui, 'faite'),
    annuler: (tache: Tache, aujourdhui: string, arreterSerie: boolean) =>
      cloturer(tache, aujourdhui, 'annulee', arreterSerie),
    reporter: (tache: Tache, echeance: string, aujourdhui: string) =>
      executer(tache.id, async () => {
        const resultat = await reporterTache(exigerSupabase(), tache.id, echeance)
        if (!resultat.ok) return `Le report a échoué. ${resultat.erreur.message}`
        notifier('succes', `Reportée au ${ouRetrouver(echeance, aujourdhui)}`)
        return null
      }),
    rouvrir: (tache: Tache) =>
      executer(tache.id, async () => {
        const resultat = await rouvrirTache(exigerSupabase(), tache.id)
        if (!resultat.ok) return `L'action a échoué. ${resultat.erreur.message}`
        notifier('succes', 'Tâche remise dans les tâches à faire')
        return null
      }),
  }
}
