import { useEnLigne } from '../lib/etat-reseau'
import Icone from './Icone'

/**
 * Bandeau « Connexion perdue », affiché en haut de l'écran tant que le réseau manque.
 * L'application ne fonctionne pas hors réseau : le bandeau prévient, sans rien bloquer.
 */
export default function BandeauHorsLigne() {
  const enLigne = useEnLigne()
  return (
    <div role="status">
      {!enLigne && (
        <p className="flex items-center justify-center gap-2 bg-alerte-doux px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-center text-sm font-semibold text-alerte">
          <Icone nom="horsLigne" className="size-5" />
          Connexion perdue. Vos modifications ne seront pas enregistrées.
        </p>
      )}
    </div>
  )
}
