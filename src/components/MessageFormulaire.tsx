type Props = { genre: 'erreur' | 'succes'; children: string }

/** Message affiché dans un formulaire : erreur (annoncée aux lecteurs d'écran) ou confirmation. */
export default function MessageFormulaire({ genre, children }: Props) {
  const couleurs =
    genre === 'erreur'
      ? 'bg-red-50 text-red-800 ring-red-200'
      : 'bg-emerald-50 text-emerald-800 ring-emerald-200'
  return (
    <p
      role={genre === 'erreur' ? 'alert' : 'status'}
      className={`rounded-lg px-3 py-2 text-sm ring-1 ${couleurs}`}
    >
      {children}
    </p>
  )
}
