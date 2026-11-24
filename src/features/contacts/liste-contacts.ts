import { useEffect, useRef, useState } from 'react'
import type { Filtre } from '../../lib/donnees'
import { useListePaginee, type LecteurPage, type ListePaginee } from '../../lib/liste-paginee'
import { exigerSupabase } from '../../lib/supabase'
import { chercherContacts, TAILLE_PAGE_CONTACTS, type Contact } from './contacts'
import { conditionsContacts, type FiltresContacts } from './filtres'
import { lireJamaisContactes, MAX_PAR_LECTURE } from './jamais-contactes'
import { aVerifierJamaisContacte } from './ligne-contact'

export type ListeContacts = Omit<ListePaginee<Contact>, 'lignes'> & { contacts: Contact[] }

/**
 * Lit une page de 50 contacts à partir du rang `debut`, pour la recherche décrite par `cle`
 * (celle de `useListeContacts`). Sert aussi à la fiche pour trouver le contact suivant.
 */
export const lirePageContacts: LecteurPage<Contact> = (cle, debut, compter) => {
  const [conditions, archives] = JSON.parse(cle) as [Filtre<'contacts'>[], boolean]
  return chercherContacts(exigerSupabase(), { conditions, archives, debut, compter })
}

/**
 * Liste des contacts à défilement progressif : 50 fiches à la fois, cherchées, filtrées
 * et triées par la base. Change de recherche ou de filtre : la liste repart du début.
 */
export function useListeContacts(filtres: FiltresContacts, archives: boolean): ListeContacts {
  const { lignes, ...liste } = useListePaginee(
    JSON.stringify([conditionsContacts(filtres), archives]),
    lirePageContacts,
    TAILLE_PAGE_CONTACTS,
  )
  return { ...liste, contacts: lignes }
}

/**
 * Liste des contacts : savoir lesquels n'ont jamais été joints. Seules les fiches dont la
 * date du dernier échange ne dépasse pas celle de la collecte sont vérifiées
 * (`aVerifierJamaisContacte`) ; les autres l'ont forcément été. Une lecture au plus par page
 * de la liste, chaque fiche n'étant demandée qu'une fois. Une lecture en échec ne dit rien
 * (la fiche reste sans réponse) : la ligne n'affiche alors pas le dernier échange.
 */
export function useJamaisContactes(contacts: readonly Contact[]): ReadonlyMap<string, boolean> {
  const [connus, setConnus] = useState<ReadonlyMap<string, boolean>>(() => new Map())
  // Fiches déjà demandées (réponse reçue, en attente ou en échec) : jamais deux fois.
  const demandees = useRef(new Set<string>())
  const aVerifier = contacts
    .filter((contact) => aVerifierJamaisContacte(contact))
    .map((contact) => contact.id)
    .join(',')

  useEffect(() => {
    const ids = aVerifier.split(',').filter((id) => id !== '' && !demandees.current.has(id))
    if (ids.length === 0) return
    for (const id of ids.slice(0, MAX_PAR_LECTURE)) demandees.current.add(id)
    // Pas d'abandon si la liste s'allonge entre-temps : la réponse vaut toujours.
    void lireJamaisContactes(exigerSupabase(), ids).then((resultat) => {
      if (resultat.ok) setConnus((avant) => new Map([...avant, ...resultat.donnees]))
    })
  }, [aVerifier])

  return connus
}
