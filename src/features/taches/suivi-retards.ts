import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { nombreEcrituresEnCours, suivreEcritures } from '../../lib/donnees'
import { dateDuJour } from '../../lib/dates'
import { supabase } from '../../lib/supabase'
import { compterTachesEnRetard } from './retards'

/** Délai avant de recompter, pour qu'une suite d'enregistrements ne compte qu'une fois. */
const DELAI_RECOMPTE_MS = 300

/**
 * Nombre de tâches en retard ; `null` tant qu'il n'est pas connu (ou si la lecture échoue :
 * la pastille ne s'affiche pas plutôt que d'afficher un nombre faux).
 */
export function useTachesEnRetard(): number | null {
  const [nombre, setNombre] = useState<number | null>(null)

  useEffect(() => {
    if (supabase === null) return
    const client: SupabaseClient = supabase
    let actif = true
    // Seule la dernière lecture lancée compte : une réponse plus ancienne est ignorée.
    let rang = 0
    let minuterie: number | undefined

    async function compterRetards() {
      const monRang = ++rang
      const resultat = await compterTachesEnRetard(client, dateDuJour())
      if (!actif || monRang !== rang) return
      setNombre(resultat.ok ? resultat.donnees : null)
    }

    function recompterBientot() {
      window.clearTimeout(minuterie)
      minuterie = window.setTimeout(() => {
        // Une écriture encore en cours : on recomptera quand elle sera revenue.
        if (nombreEcrituresEnCours() === 0) void compterRetards()
      }, DELAI_RECOMPTE_MS)
    }

    function auRetour() {
      if (document.visibilityState === 'visible') recompterBientot()
    }

    void compterRetards()
    const arreterSuivi = suivreEcritures(recompterBientot)
    document.addEventListener('visibilitychange', auRetour)
    window.addEventListener('focus', auRetour)
    window.addEventListener('online', recompterBientot)
    return () => {
      actif = false
      window.clearTimeout(minuterie)
      arreterSuivi()
      document.removeEventListener('visibilitychange', auRetour)
      window.removeEventListener('focus', auRetour)
      window.removeEventListener('online', recompterBientot)
    }
  }, [])

  return nombre
}
