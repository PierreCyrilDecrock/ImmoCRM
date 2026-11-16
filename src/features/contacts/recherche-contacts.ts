import { useEffect, useState } from 'react'
import { useValeurDifferee } from '../../lib/differer'
import { termesRecherche } from '../../lib/recherche'
import { exigerSupabase } from '../../lib/supabase'
import { chercherContacts, type Contact } from './contacts'
import { conditionsContacts, FILTRES_VIDES } from './filtres'

export type EtatRecherche =
  | { phase: 'vide' }
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; contacts: Contact[]; total: number }

type Reponse = { cle: string; etat: EtatRecherche }

/**
 * Recherche de contacts au fil de la frappe (champ de recherche global, choix d'une fiche).
 * Attend la fin de la frappe, interroge la base et ignore les réponses arrivées trop tard.
 * `sauf` écarte une fiche des résultats (celle depuis laquelle on cherche).
 */
export function useRechercheContacts(
  saisie: string,
  options: { taille?: number; sauf?: string } = {},
): EtatRecherche {
  const { taille = 6, sauf } = options
  const cle = termesRecherche(saisie).join(' ')
  const cleDifferee = useValeurDifferee(cle)
  const [reponse, setReponse] = useState<Reponse | null>(null)

  useEffect(() => {
    if (cleDifferee === '') return
    let actif = true
    void chercherContacts(exigerSupabase(), {
      conditions: conditionsContacts({ ...FILTRES_VIDES, recherche: cleDifferee }),
      // Une fiche de plus, au cas où celle à écarter serait dans les résultats.
      taille: sauf === undefined ? taille : taille + 1,
      compter: true,
    }).then((resultat) => {
      if (!actif) return
      if (!resultat.ok) {
        setReponse({
          cle: cleDifferee,
          etat: { phase: 'erreur', message: resultat.erreur.message },
        })
        return
      }
      const lignes = resultat.donnees.lignes
      const contacts = lignes.filter((contact) => contact.id !== sauf).slice(0, taille)
      const ecartes = lignes.length - lignes.filter((contact) => contact.id !== sauf).length
      const total = (resultat.donnees.total ?? lignes.length) - ecartes
      setReponse({ cle: cleDifferee, etat: { phase: 'pret', contacts, total } })
    })
    return () => {
      actif = false
    }
  }, [cleDifferee, taille, sauf])

  if (cle === '') return { phase: 'vide' }
  // Tant que la réponse ne correspond pas à ce qui est tapé, la recherche est en cours.
  if (reponse === null || reponse.cle !== cle) return { phase: 'chargement' }
  return reponse.etat
}
