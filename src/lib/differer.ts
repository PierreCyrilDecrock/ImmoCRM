import { useEffect, useState } from 'react'

/**
 * Renvoie la valeur reçue, mais seulement une fois qu'elle n'a plus changé pendant `delai`
 * millisecondes. Sert à attendre la fin de la frappe avant de lancer une recherche.
 */
export function useValeurDifferee<V>(valeur: V, delai = 250): V {
  const [differee, setDifferee] = useState(valeur)
  useEffect(() => {
    const attente = window.setTimeout(() => setDifferee(valeur), delai)
    return () => window.clearTimeout(attente)
  }, [valeur, delai])
  return differee
}
