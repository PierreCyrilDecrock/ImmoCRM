import { formaterHeure } from '../../lib/dates'

/**
 * Le trait rouge « maintenant » de l'agenda du jour, avec l'heure, entre les rendez-vous
 * commencés et ceux à venir. Une ligne de la liste des rendez-vous.
 */
export default function TraitMaintenant({ heure }: { heure: string }) {
  return (
    <li className="flex items-center gap-2 py-1.5">
      <span className="sr-only">Il est {formaterHeure(heure)}.</span>
      <span
        aria-hidden="true"
        className="min-w-11 shrink-0 text-center text-xs font-bold whitespace-nowrap text-danger tabular-nums"
      >
        {formaterHeure(heure)}
      </span>
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-danger" />
      <span aria-hidden="true" className="h-0.5 flex-1 rounded-full bg-danger" />
    </li>
  )
}
