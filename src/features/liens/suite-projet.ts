import { useEffect, useState } from 'react'
import { exigerSupabase } from '../../lib/supabase'
import type { Contact } from '../contacts/contacts'
import { lireProchaineTache, lireProchaineTacheLiee } from '../taches/taches'
import { quiDansLaPhrase, suiteProjet, type SuiteProjet } from './fiche-projet'
import type { LienProjet } from './lien-projet'

/**
 * Ce qui est prévu pour un projet (revue n° 2, proposition 6) : sa prochaine tâche, sinon la
 * prochaine action de son contact, ailleurs. La fiche en tire la carte orange ou la phrase
 * grise de « À venir » (`suiteProjet`). Relu quand `version` change.
 */
export function useSuiteProjet({
  lien,
  contact,
  actif,
  aujourdhui,
  version,
  pret,
}: {
  lien: LienProjet
  contact: Contact | null
  actif: boolean
  aujourdhui: string
  version: number
  /** Le projet est lu : sans lui, on ne connaît ni son contact ni son état. */
  pret: boolean
}): SuiteProjet {
  const [suite, setSuite] = useState<SuiteProjet>({ forme: 'chargement' })
  const contactId = contact?.id ?? null
  const qui = contact === null ? '' : quiDansLaPhrase(contact)

  useEffect(() => {
    if (!pret) return
    let encore = true
    async function lire(): Promise<SuiteProjet> {
      const client = exigerSupabase()
      const tache = await lireProchaineTacheLiee(
        client,
        lien.genre === 'vendeur' ? { projetVendeurId: lien.id } : { projetAcquereurId: lien.id },
      )
      // Une lecture qui échoue ne fait pas crier la fiche : la phrase grise, sans détail.
      if (!tache.ok) return suiteProjet({ tache: false, actif: false, ailleurs: null, aujourdhui })
      if (tache.donnees !== null) return { forme: 'tache' }
      const ailleurs = contactId === null ? null : await lireProchaineTache(client, contactId)
      const action = ailleurs?.ok === true ? ailleurs.donnees : null
      return suiteProjet({
        tache: false,
        // Sans réponse de la base sur le contact, pas d'alerte : on ne sait pas.
        actif: actif && (ailleurs === null || ailleurs.ok),
        ailleurs: action === null ? null : { qui, echeance: action.echeance, titre: action.titre },
        aujourdhui,
      })
    }
    void lire().then((lue) => {
      if (encore) setSuite(lue)
    })
    return () => {
      encore = false
    }
  }, [pret, lien.genre, lien.id, contactId, qui, actif, aujourdhui, version])

  return suite
}
