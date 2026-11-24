import type { ReactNode } from 'react'

/**
 * Un groupe de pastilles (source, température, type…), avec son nom écrit au-dessus : chaque
 * groupe porte sa légende visible (revue de design, règle 7). Entre deux pastilles, 8 px ;
 * entre deux groupes, la page en met davantage (`gap-6`). `complement` se place sous les
 * pastilles, dans le même groupe (les autres types d'échange, la recherche d'un contact).
 */
export default function GroupePastilles({
  legende,
  complement,
  children,
}: {
  legende: string
  complement?: ReactNode
  children: ReactNode
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-encre">{legende}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
      {complement}
    </fieldset>
  )
}
