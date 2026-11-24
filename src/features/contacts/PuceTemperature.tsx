import type { Temperature } from './contacts'
import { COULEURS_TEMPERATURE } from './fiche-contact'

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
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${COULEURS_TEMPERATURE[temperature]}`}
      />
      <span className="sr-only">Température : </span>
      {texte}
    </span>
  )
}
