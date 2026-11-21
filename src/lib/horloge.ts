import { useEffect, useState } from 'react'

/** Les millisecondes jusqu'au début de la minute suivante (l'heure de Paris tombe aussi pile). */
export function delaiAvantMinuteSuivante(maintenant: Date): number {
  return 60_000 - (maintenant.getTime() % 60_000)
}

/**
 * L'instant présent, remis à jour au début de chaque minute et au retour dans l'application
 * (un téléphone mis en veille arrête les minuteries). Pour un écran qui affiche un temps
 * restant ou la place de « maintenant » dans la journée.
 */
export function useMaintenant(): Date {
  const [maintenant, setMaintenant] = useState(() => new Date())

  useEffect(() => {
    let minuterie = 0
    function programmer() {
      // Un léger retard : la minuterie ne part jamais une fraction de seconde trop tôt.
      minuterie = window.setTimeout(
        () => {
          setMaintenant(new Date())
          programmer()
        },
        delaiAvantMinuteSuivante(new Date()) + 50,
      )
    }
    function auRetour() {
      if (document.visibilityState === 'visible') setMaintenant(new Date())
    }
    programmer()
    document.addEventListener('visibilitychange', auRetour)
    return () => {
      window.clearTimeout(minuterie)
      document.removeEventListener('visibilitychange', auRetour)
    }
  }, [])

  return maintenant
}
