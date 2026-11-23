import { formaterHeure } from '../../lib/dates'

/**
 * Le trait rouge « maintenant » de l'agenda du jour, entre les rendez-vous commencés et
 * ceux à venir : l'heure dans la colonne des heures, puis un trait qui traverse la frise.
 * Une ligne de la liste des rendez-vous.
 */
export default function TraitMaintenant({ heure }: { heure: string }) {
  return (
    <li className="flex items-center gap-1 py-1">
      <span className="sr-only">Il est {formaterHeure(heure)}.</span>
      <span
        aria-hidden="true"
        className="w-14 shrink-0 text-xs font-bold whitespace-nowrap text-danger tabular-nums"
      >
        {formaterHeure(heure)}
      </span>
      <span aria-hidden="true" className="-ml-1 size-2 shrink-0 rounded-full bg-danger" />
      <span aria-hidden="true" className="h-0.5 flex-1 rounded-full bg-danger" />
    </li>
  )
}
