import type { Progression } from './maintenant'

const RAYON = 22
const CIRCONFERENCE = 2 * Math.PI * RAYON

/**
 * L'anneau « 3 sur 7 faits » de l'en-tête d'Aujourd'hui : il se remplit à mesure que les
 * tâches et relances du jour sont cochées. Le dessin est caché aux lecteurs d'écran, qui
 * lisent la phrase équivalente (annoncée quand elle change).
 */
export default function AnneauProgression({ progression }: { progression: Progression }) {
  const rempli = Math.min(1, Math.max(0, progression.part)) * CIRCONFERENCE
  const complet = progression.faites === progression.total
  return (
    <div className="flex shrink-0 items-center gap-2 md:gap-3">
      <svg viewBox="0 0 56 56" className="size-11 -rotate-90 md:size-14" aria-hidden="true">
        <circle
          cx="28"
          cy="28"
          r={RAYON}
          fill="none"
          strokeWidth="6"
          className="stroke-bord-fort/35"
        />
        <circle
          cx="28"
          cy="28"
          r={RAYON}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${rempli} ${CIRCONFERENCE}`}
          className={`stroke-succes transition-[stroke-dasharray] duration-500 ${rempli === 0 ? 'opacity-0' : ''}`}
        />
      </svg>
      <p aria-hidden="true" className="flex items-baseline gap-1 leading-tight md:block">
        <span className="block text-lg font-bold text-encre tabular-nums">{progression.texte}</span>
        <span
          className={`block text-sm ${complet ? 'font-semibold text-succes' : 'text-encre-douce'}`}
        >
          {complet ? 'tout est fait' : progression.suite}
        </span>
      </p>
      <p className="sr-only" aria-live="polite">
        {progression.annonce}
      </p>
    </div>
  )
}
