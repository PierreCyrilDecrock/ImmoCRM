import type { ReactNode } from 'react'

/** Dessins disponibles. Pour en ajouter un : un tracé sur une grille de 24 × 24, au trait. */
const TRACES = {
  aujourdhui: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="m9 15.5 2 2 4-4" />
    </>
  ),
  contacts: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18.5 14.6c1.8.9 3 2.7 3 5.4" />
    </>
  ),
  biens: (
    <>
      <path d="m3 11 9-7.5 9 7.5" />
      <path d="M5 9.5V20h5v-6h4v6h5V9.5" />
    </>
  ),
  pipelines: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="11" rx="1.5" />
      <rect x="16" y="4" width="5" height="7" rx="1.5" />
    </>
  ),
  taches: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="m8 12.5 3 3 5.5-6.5" />
    </>
  ),
  plus: (
    <>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </>
  ),
  reglages: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  palette: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  retour: <path d="m15 5-7 7 7 7" />,
  fermer: <path d="M6 6l12 12M18 6 6 18" />,
  ajouter: <path d="M12 5v14M5 12h14" />,
  succes: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 3 3 5-6" />
    </>
  ),
  erreur: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5v.01" />
    </>
  ),
  horsLigne: (
    <>
      <path d="M2.5 9a14.5 14.5 0 0 1 5-3.2M12 4.5c3.6 0 6.9 1.3 9.5 3.5M6 12.5a9.5 9.5 0 0 1 4-2.2M15 10.6c1.1.4 2.1 1 3 1.9M9.5 16a4 4 0 0 1 5 0" />
      <path d="M12 19.5v.01M4 3l16 18" />
    </>
  ),
  vide: (
    <>
      <path d="M3.5 13 6 5.5A2 2 0 0 1 7.9 4h8.2A2 2 0 0 1 18 5.5L20.5 13" />
      <path d="M3.5 13v5a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5h-5.5a3.5 3.5 0 0 1-7 0z" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type NomIcone = keyof typeof TRACES

type Props = { nom: NomIcone; className?: string }

/**
 * Petit dessin au trait, de la couleur du texte qui l'entoure. Purement décoratif :
 * le sens est toujours porté par un texte voisin (ou un `aria-label` sur le bouton).
 */
export default function Icone({ nom, className = 'size-6' }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {TRACES[nom]}
    </svg>
  )
}
