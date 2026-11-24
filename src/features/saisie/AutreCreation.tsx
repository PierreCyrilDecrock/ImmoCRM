import Icone from '../../components/Icone'

/**
 * « Créer autre chose », dans l'en-tête d'une fenêtre de création ouverte directement par le
 * « + » (le contact sur la page Contacts, le bien sur la page Biens…) : il ouvre le menu
 * complet de la saisie rapide. Discret, en gris : il ne concurrence pas « Enregistrer ».
 */
export default function AutreCreation({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-medium text-encre-douce hover:bg-creux hover:text-encre focus-visible:outline-2 focus-visible:outline-accent"
    >
      Créer autre chose
      <Icone nom="chevron" className="size-4" />
    </button>
  )
}
