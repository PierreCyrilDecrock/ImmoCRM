import Icone from '../../components/Icone'

type Props = {
  titre: string
  occupee: boolean
  onCocher: () => void
  /** Sur le fond encre de la carte « Maintenant ». */
  inverse?: boolean
}

/** La case ronde qui clôt une tâche d'un toucher (44 px), comme dans la liste des tâches. */
export default function CaseTache({ titre, occupee, onCocher, inverse = false }: Props) {
  return (
    <button
      type="button"
      disabled={occupee}
      onClick={onCocher}
      aria-label={`Marquer « ${titre} » comme faite`}
      className="group flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
    >
      <span
        className={`flex size-6 items-center justify-center rounded-full border-2 text-transparent ${
          inverse
            ? 'border-sur-inverse-doux group-hover:border-sur-inverse group-hover:text-sur-inverse'
            : 'border-bord-fort group-hover:border-succes group-hover:text-succes'
        }`}
      >
        <Icone nom="succes" className="size-4" />
      </span>
    </button>
  )
}
