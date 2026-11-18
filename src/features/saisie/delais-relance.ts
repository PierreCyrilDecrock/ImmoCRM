import { useEffect, useState } from 'react'
import { exigerSupabase } from '../../lib/supabase'
import { DELAIS_PAR_DEFAUT, type DelaisRelance } from '../relances/delais'
import { lireReglages } from '../reglages/reglages'

/** Les délais de relance choisis dans Réglages ; ceux par défaut tant qu'ils ne sont pas lus. */
export function useDelaisRelance(): DelaisRelance {
  const [delais, setDelais] = useState<DelaisRelance>(DELAIS_PAR_DEFAUT)
  useEffect(() => {
    let actif = true
    void lireReglages(exigerSupabase()).then((resultat) => {
      if (actif && resultat.ok) setDelais(resultat.donnees.delais_relance)
    })
    return () => {
      actif = false
    }
  }, [])
  return delais
}
