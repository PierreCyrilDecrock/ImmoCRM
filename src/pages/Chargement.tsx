import EtatChargement from '../components/EtatChargement'

/** Écran d'attente, le temps de savoir si une session existe. */
export default function Chargement() {
  return (
    <main className="flex min-h-0 flex-1 items-center justify-center">
      <EtatChargement />
    </main>
  )
}
