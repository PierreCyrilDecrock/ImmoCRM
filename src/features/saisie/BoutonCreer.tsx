import Bouton from '../../components/Bouton'
import { ouvrirMenuCreation } from './ouverture'

/**
 * Bouton « Créer », en bas de la colonne de navigation sur ordinateur : il ouvre le menu de
 * création, comme la touche N (et comme le bouton « + » sur téléphone et tablette).
 */
export default function BoutonCreer() {
  return (
    <Bouton
      icone="ajouter"
      pleineLargeur
      onClick={ouvrirMenuCreation}
      aria-haspopup="dialog"
      aria-keyshortcuts="N"
      title="Créer un contact, une activité, une tâche… (N)"
    >
      <span className="flex-1 text-left">Créer</span>
      <kbd
        aria-hidden="true"
        className="rounded-md px-1.5 py-0.5 font-sans text-xs font-medium ring-1 ring-sur-plein/50"
      >
        N
      </kbd>
    </Bouton>
  )
}
