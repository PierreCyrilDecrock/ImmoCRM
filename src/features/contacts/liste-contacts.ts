import type { Filtre } from '../../lib/donnees'
import { useListePaginee, type LecteurPage, type ListePaginee } from '../../lib/liste-paginee'
import { exigerSupabase } from '../../lib/supabase'
import { chercherContacts, TAILLE_PAGE_CONTACTS, type Contact } from './contacts'
import { conditionsContacts, type FiltresContacts } from './filtres'

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
