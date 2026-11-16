import { useCallback, useEffect, useRef, useState } from 'react'
import type { PageLignes, Resultat } from './donnees'
import { useValeurDifferee } from './differer'

/** Lit une page : `cle` décrit la recherche en cours, `debut` le rang de la première ligne. */
export type LecteurPage<L> = (
  cle: string,
  debut: number,
  compter: boolean,
) => Promise<Resultat<PageLignes<L>>>

type Chargement<L> = {
  /** Recherche, filtres et archives auxquels ces lignes répondent. */
  cle: string
  lignes: L[]
  total: number | null
  /** Vrai quand la dernière page a été lue. */
  complet: boolean
  erreur: string | null
  erreurSuite: string | null
}

export type ListePaginee<L> = {
  /** Première lecture en cours : rien à afficher encore. */
  chargement: boolean
  /** Les lignes affichées datent de la recherche précédente : la nouvelle arrive. */
  rafraichissement: boolean
  lignes: L[]
  total: number | null
  erreur: string | null
  /** Il reste des lignes à lire après celles affichées. */
  resteALire: boolean
  suiteEnCours: boolean
  erreurSuite: string | null
  chargerSuite: () => void
}

/**
 * Liste à défilement progressif : une page à la fois, cherchée, filtrée et triée par la
 * base. Quand `cle` change (après la fin de la frappe), la liste repart du début.
 * `lire` doit être une fonction stable (définie hors du composant).
 */
export function useListePaginee<L extends { id: string }>(
  cleImmediate: string,
  lire: LecteurPage<L>,
  taillePage: number,
): ListePaginee<L> {
  const cle = useValeurDifferee(cleImmediate)
  const [etat, setEtat] = useState<Chargement<L> | null>(null)
  const [suiteEnCours, setSuiteEnCours] = useState(false)
  const lecture = useRef(false)

  useEffect(() => {
    let actif = true
    void lire(cle, 0, true).then((resultat) => {
      if (!actif) return
      const lignes = resultat.ok ? resultat.donnees.lignes : []
      setEtat({
        cle,
        lignes,
        total: resultat.ok ? resultat.donnees.total : null,
        complet: lignes.length < taillePage,
        erreur: resultat.ok ? null : resultat.erreur.message,
        erreurSuite: null,
      })
    })
    return () => {
      actif = false
    }
  }, [cle, lire, taillePage])

  const aJour = etat !== null && etat.cle === cle
  const resteALire = aJour && etat.erreur === null && !etat.complet

  const chargerSuite = useCallback(() => {
    if (etat === null || etat.cle !== cle || etat.complet || lecture.current) return
    lecture.current = true
    setSuiteEnCours(true)
    void lire(cle, etat.lignes.length, false).then((resultat) => {
      lecture.current = false
      setSuiteEnCours(false)
      setEtat((actuel) => {
        // Entre-temps, la recherche a changé : cette suite ne sert plus.
        if (actuel === null || actuel.cle !== cle) return actuel
        if (!resultat.ok) return { ...actuel, erreurSuite: resultat.erreur.message }
        const connus = new Set(actuel.lignes.map((ligne) => ligne.id))
        const nouvelles = resultat.donnees.lignes.filter((ligne) => !connus.has(ligne.id))
        return {
          ...actuel,
          lignes: [...actuel.lignes, ...nouvelles],
          complet: resultat.donnees.lignes.length < taillePage,
          erreurSuite: null,
        }
      })
    })
  }, [etat, cle, lire, taillePage])

  return {
    chargement: etat === null,
    rafraichissement: etat !== null && !aJour,
    lignes: etat?.lignes ?? [],
    total: etat?.total ?? null,
    erreur: etat?.erreur ?? null,
    resteALire,
    suiteEnCours,
    erreurSuite: etat?.erreurSuite ?? null,
    chargerSuite,
  }
}
