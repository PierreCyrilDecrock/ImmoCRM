type Props = { libelle?: string }

/** À afficher pendant qu'une page ou une liste attend ses données. */
export default function EtatChargement({ libelle = 'Chargement…' }: Props) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 px-4 py-10 text-encre-douce">
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-4 border-bord border-t-accent motion-reduce:animate-none"
      />
      <p className="text-sm">{libelle}</p>
    </div>
  )
}
