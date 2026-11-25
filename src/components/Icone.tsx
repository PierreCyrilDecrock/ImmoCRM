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
  moins: <path d="M5 12h14" />,
  retablir: (
    <>
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4v4.5h4.5" />
    </>
  ),
  cadenas: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
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
  telephone: (
    <path d="M5 3.5h3.2l1.6 4.2-2 1.5a12 12 0 0 0 7 7l1.5-2 4.2 1.6V19a1.8 1.8 0 0 1-1.9 1.8C10.6 20.3 3.7 13.4 3.2 5.4A1.8 1.8 0 0 1 5 3.5z" />
  ),
  sms: (
    <>
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-4.5 3.5V17H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
      <path d="M8 11v.01M12 11v.01M16 11v.01" />
    </>
  ),
  courriel: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6.5L20.5 7" />
    </>
  ),
  modifier: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="m13 7 4 4" />
    </>
  ),
  archiver: (
    <>
      <rect x="3" y="4" width="18" height="5" rx="1.5" />
      <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13.5h4" />
    </>
  ),
  recherche: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </>
  ),
  filtrer: <path d="M4 6h16M7 12h10M10 18h4" />,
  fusionner: (
    <>
      <path d="M5 4v3a5 5 0 0 0 5 5h2M5 20v-3a5 5 0 0 1 5-5" />
      <path d="M12 12h8M16.5 8.5 20 12l-3.5 3.5" />
    </>
  ),
  photo: (
    <>
      <path d="M4 7.5h3l1.5-2.5h7L17 7.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  galerie: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m3.5 17 5-5 4 4 3-3 5 5" />
    </>
  ),
  supprimer: (
    <>
      <path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 12a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 17 19l1-12" />
      <path d="M10 11v5.5M14 11v5.5" />
    </>
  ),
  horloge: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  repeter: (
    <>
      <path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19m-3-3 3 3-3 3" />
      <path d="M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5m3 3-3-3 3-3" />
    </>
  ),
  lieu: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  journal: (
    <>
      <path d="M6 3.5h10.5a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6z" />
      <path d="M6 3.5v17M9.5 8h5M9.5 11.5h5" />
    </>
  ),
  note: (
    <>
      <path d="M5 4.5h14v9.5l-5 5.5H5z" />
      <path d="M14 19.5V14h5M8.5 9h7M8.5 12h4" />
    </>
  ),
  document: (
    <>
      <path d="M13.5 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z" />
      <path d="M13.5 3.5v5h5M12 17.5v-6M9.5 14l2.5-2.5 2.5 2.5" />
    </>
  ),
  estimation: (
    <>
      <path d="M16.5 7.5a6 6 0 1 0 0 9" />
      <path d="M5 10.5h8M5 13.5h8" />
    </>
  ),
  poignee: (
    <>
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </>
  ),
  itineraire: <path d="M20.5 3.5 3.5 10.5l7 3 3 7z" />,
  alerte: (
    <>
      <path d="M10.3 4.2 2.9 17.5A2 2 0 0 0 4.6 20.5h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4M12 17h.01" />
    </>
  ),
  nouveaute: (
    <>
      <path d="M4 13.5 6.5 5h11l2.5 8.5" />
      <path d="M4 13.5V19h16v-5.5h-5a3 3 0 0 1-6 0z" />
      <path d="M12 2.5v4M10 4.5l2 2 2-2" />
    </>
  ),
  copier: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
    </>
  ),
  calendrier: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M8 14h2M14 14h2M8 17h2" />
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
