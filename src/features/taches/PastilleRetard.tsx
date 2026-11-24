type Props = {
  /** Le retard court : « 3 j » (`pastilleRetard`). */
  texte: string
  /** Ce qu'entend un lecteur d'écran : « En retard de 3 jours ». Absent : la ligne le dit déjà. */
  annonce?: string
}

/**
 * Le retard d'une échéance en pastille rouge courte (« 3 j »), en chiffres alignés. Sert aux
 * relances de l'accueil et à la liste des contacts.
 */
export default function PastilleRetard({ texte, annonce }: Props) {
  return (
    <>
      <span
        aria-hidden="true"
        title={annonce}
        className="shrink-0 rounded-full bg-danger-doux px-2 py-0.5 text-[0.8125rem] font-semibold whitespace-nowrap text-danger tabular-nums"
      >
        {texte}
      </span>
      {annonce !== undefined && <span className="sr-only">, {annonce}</span>}
    </>
  )
}
