import { LIBELLES_ENREGISTREMENT, useEtatEnregistrement } from '../lib/etat-enregistrement'
import { libelleVersion, VERSION } from '../lib/version'

const PASTILLES = {
  enregistre: 'bg-succes',
  en_cours: 'bg-accent motion-safe:animate-pulse',
  hors_ligne: 'bg-alerte',
} as const

/**
 * Bas de la colonne de navigation, sur ordinateur : l'état des enregistrements (« Tout est
 * enregistré », « Enregistrement… », « Connexion perdue ») et la version de l'application.
 * Pas d'annonce aux lecteurs d'écran : chaque enregistrement est déjà confirmé par un
 * message, et la connexion perdue par le bandeau du haut.
 */
export default function EtatEnregistrement() {
  const etat = useEtatEnregistrement()
  return (
    <div className="flex flex-col gap-0.5 px-1 text-xs text-encre-douce">
      <p className="flex items-center gap-2">
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${PASTILLES[etat]}`} />
        {LIBELLES_ENREGISTREMENT[etat]}
      </p>
      <p>{libelleVersion(VERSION)}</p>
    </div>
  )
}
