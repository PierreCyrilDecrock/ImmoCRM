import type { Filtre } from '../../lib/donnees'
import { useListePaginee, type LecteurPage, type ListePaginee } from '../../lib/liste-paginee'
import { exigerSupabase } from '../../lib/supabase'
import { chercherBiens, TAILLE_PAGE_BIENS, type Bien } from './biens'
import { conditionsBiens, type FiltresBiens } from './filtres'

const lirePage: LecteurPage<Bien> = (cle, debut, compter) => {
  const [conditions, archives] = JSON.parse(cle) as [Filtre<'biens'>[], boolean]
  return chercherBiens(exigerSupabase(), { conditions, archives, debut, compter })
}

/**
 * Liste des biens à défilement progressif : 50 fiches à la fois, cherchées, filtrées et
 * triées par la base. Change de recherche ou de filtre : la liste repart du début.
 */
export function useListeBiens(filtres: FiltresBiens, archives: boolean): ListePaginee<Bien> {
  return useListePaginee(
    JSON.stringify([conditionsBiens(filtres), archives]),
    lirePage,
    TAILLE_PAGE_BIENS,
  )
}
