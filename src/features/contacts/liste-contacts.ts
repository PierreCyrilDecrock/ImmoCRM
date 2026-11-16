import { useCallback, useEffect, useRef, useState } from 'react'
import type { Filtre } from '../../lib/donnees'
import { useValeurDifferee } from '../../lib/differer'
import { exigerSupabase } from '../../lib/supabase'
import { chercherContacts, TAILLE_PAGE_CONTACTS, type Contact } from './contacts'
import { conditionsContacts, type FiltresContacts } from './filtres'

type Chargement = {
  /** Recherche, filtres et archives auxquels ces fiches répondent. */
  cle: string
  contacts: Contact[]
  total: number | null
  /** Vrai quand la dernière page a été lue. */
  complet: boolean
  erreur: string | null
  erreurSuite: string | null
}

export type ListeContacts = {
  /** Première lecture en cours : rien à afficher encore. */
  chargement: boolean
  /** Les fiches affichées datent de la recherche précédente : la nouvelle arrive. */
  rafraichissement: boolean
  contacts: Contact[]
  total: number | null
  erreur: string | null
  /** Il reste des fiches à lire après celles affichées. */
  resteALire: boolean
  suiteEnCours: boolean
  erreurSuite: string | null
  chargerSuite: () => void
}

/**
 * Liste des contacts à défilement progressif : 50 fiches à la fois, cherchées, filtrées
 * et triées par la base. Change de recherche ou de filtre : la liste repart du début.
 */
export function useListeContacts(filtres: FiltresContacts, archives: boolean): ListeContacts {
  const cle = useValeurDifferee(JSON.stringify([conditionsContacts(filtres), archives]))
  const [etat, setEtat] = useState<Chargement | null>(null)
  const [suiteEnCours, setSuiteEnCours] = useState(false)
  const lecture = useRef(false)

  useEffect(() => {
    let actif = true
    const [conditions, avecArchives] = JSON.parse(cle) as [Filtre<'contacts'>[], boolean]
    void chercherContacts(exigerSupabase(), {
      conditions,
      archives: avecArchives,
      compter: true,
    }).then((resultat) => {
      if (!actif) return
      const lignes = resultat.ok ? resultat.donnees.lignes : []
      setEtat({
        cle,
        contacts: lignes,
        total: resultat.ok ? resultat.donnees.total : null,
        complet: lignes.length < TAILLE_PAGE_CONTACTS,
        erreur: resultat.ok ? null : resultat.erreur.message,
        erreurSuite: null,
      })
    })
    return () => {
      actif = false
    }
  }, [cle])

  const aJour = etat !== null && etat.cle === cle
  const resteALire = aJour && etat.erreur === null && !etat.complet

  const chargerSuite = useCallback(() => {
    if (etat === null || etat.cle !== cle || etat.complet || lecture.current) return
    lecture.current = true
    setSuiteEnCours(true)
    const [conditions, avecArchives] = JSON.parse(cle) as [Filtre<'contacts'>[], boolean]
    void chercherContacts(exigerSupabase(), {
      conditions,
      archives: avecArchives,
      debut: etat.contacts.length,
    }).then((resultat) => {
      lecture.current = false
      setSuiteEnCours(false)
      setEtat((actuel) => {
        // Entre-temps, la recherche a changé : cette suite ne sert plus.
        if (actuel === null || actuel.cle !== cle) return actuel
        if (!resultat.ok) return { ...actuel, erreurSuite: resultat.erreur.message }
        const connus = new Set(actuel.contacts.map((contact) => contact.id))
        const nouveaux = resultat.donnees.lignes.filter((contact) => !connus.has(contact.id))
        return {
          ...actuel,
          contacts: [...actuel.contacts, ...nouveaux],
          complet: resultat.donnees.lignes.length < TAILLE_PAGE_CONTACTS,
          erreurSuite: null,
        }
      })
    })
  }, [etat, cle])

  return {
    chargement: etat === null,
    rafraichissement: etat !== null && !aJour,
    contacts: etat?.contacts ?? [],
    total: etat?.total ?? null,
    erreur: etat?.erreur ?? null,
    resteALire,
    suiteEnCours,
    erreurSuite: etat?.erreurSuite ?? null,
    chargerSuite,
  }
}
