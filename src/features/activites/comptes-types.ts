import { useEffect, useState } from 'react'
import type { Resultat } from '../../lib/donnees'
import type { ListePaginee } from '../../lib/liste-paginee'
import { BORNE_TYPES_ACTIVITES, type ActiviteAffichee } from './activites'
import { compterTypes, type ComptesTypes } from './historique'

type Lus = { cle: string; comptes: ComptesTypes | null }

/**
 * Les nombres des pastilles « Appels 3 » d'un historique ou du journal. `cle` décrit la
 * lecture sans son filtre de type (fiche, période, numéro de relecture) : c'est la clé du fil
 * quand « Tout » est choisi. Ils viennent d'abord des lignes déjà lues (fil sur « Tout », lu
 * en entier : aucune requête de plus, le cas de presque toutes les fiches) ; sinon d'une
 * seule requête bornée (`lire`, qui ne lit que la colonne du type). Changer de type ne les
 * relit pas ; pendant une relecture, les précédents restent affichés. `null` : pas encore
 * connus, ou la lecture a échoué (la rangée ne s'affiche alors que si un type est choisi).
 */
export function useComptesTypes(
  cle: string,
  filSurTout: boolean,
  fil: Pick<ListePaginee<ActiviteAffichee>, 'cle' | 'lignes' | 'resteALire' | 'erreur'>,
  lire: (cle: string) => Promise<Resultat<string[]>>,
): ComptesTypes | null {
  const [lus, setLus] = useState<Lus | null>(null)

  // Le fil sur « Tout », lu en entier pour cette clé : ses lignes suffisent.
  const depuisFil = filSurTout && fil.cle === cle && fil.erreur === null && !fil.resteALire
  if (depuisFil && lus?.cle !== cle) {
    // Mémorisé pendant le rendu (et non dans un effet) : le changement de type qui suit
    // trouve ces nombres sans relire.
    setLus({
      cle,
      comptes: compterTypes(
        fil.lignes.map((ligne) => ligne.activite.type),
        true,
      ),
    })
  }

  // Le fil sur « Tout » n'a pas encore répondu pour cette clé : on attend ses lignes.
  const attendreFil = filSurTout && fil.cle !== cle
  const aLire = lus?.cle !== cle && !depuisFil && !attendreFil

  useEffect(() => {
    if (!aLire) return
    let actif = true
    void lire(cle).then((resultat) => {
      if (!actif) return
      setLus({
        cle,
        comptes: resultat.ok
          ? compterTypes(resultat.donnees, resultat.donnees.length < BORNE_TYPES_ACTIVITES)
          : null,
      })
    })
    return () => {
      actif = false
    }
  }, [aLire, cle, lire])

  return lus?.comptes ?? null
}
