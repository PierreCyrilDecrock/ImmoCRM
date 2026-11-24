import type { Temperature } from './contacts'

/** Une couleur par température : chaud en rouge, tiède en ambre, froid en bleu, veille en gris. */
const COULEURS: Record<Temperature, string> = {
  chaud: 'bg-danger',
  tiede: 'bg-alerte',
  froid: 'bg-accent',
  veille: 'bg-bord-fort',
}

type Props = {
  temperature: Temperature
  /** Le libellé : « Chaud », « Tiède »… */
  texte: string
}

/**
 * La température d'un contact en petite puce colorée suivie de son nom (« ● Chaud »). Le nom
 * est toujours écrit : la couleur ne le dit jamais seule.
 */
export default function PuceTemperature({ temperature, texte }: Props) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap text-encre-douce">
      <span aria-hidden="true" className={`size-2 rounded-full ${COULEURS[temperature]}`} />
      <span className="sr-only">Température : </span>
      {texte}
    </span>
  )
}
