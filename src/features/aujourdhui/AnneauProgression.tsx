import type { Progression } from './maintenant'

const RAYON = 22
const CIRCONFERENCE = 2 * Math.PI * RAYON

/**
 * L'anneau de progression, à droite du titre « Bonjour … » de l'écran Aujourd'hui (40 px sur
 * téléphone) : il se remplit à mesure que les tâches et relances du jour sont cochées, et se
 * marque d'une coche quand tout est fait. Il n'apparaît qu'au premier geste
 * (`progression.anneau`) : vide, il ressemblerait à un chargement. Le nombre est écrit dans
 * la phrase de résumé ; le dessin est caché aux lecteurs d'écran.
 */
export default function AnneauProgression({ progression }: { progression: Progression }) {
  const rempli = Math.min(1, Math.max(0, progression.part)) * CIRCONFERENCE
  const complet = progression.faites >= progression.total
  return (
    <span
      aria-hidden="true"
      className="relative flex size-10 shrink-0 items-center justify-center md:size-12"
    >
      <svg viewBox="0 0 56 56" className="absolute inset-0 size-full -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={RAYON}
          fill="none"
          strokeWidth="7"
          className="stroke-bord-fort/35"
        />
        <circle
          cx="28"
          cy="28"
          r={RAYON}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${rempli} ${CIRCONFERENCE}`}
          className="stroke-succes transition-[stroke-dasharray] duration-500"
        />
      </svg>
      {complet && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative size-5 text-succes md:size-6"
        >
          <path d="m6.5 12.5 3.5 3.5 7.5-8" />
        </svg>
      )}
    </span>
  )
}
