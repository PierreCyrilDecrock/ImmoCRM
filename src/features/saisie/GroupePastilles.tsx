import type { ReactNode } from 'react'

/** Un groupe de pastilles (source, température, type…), avec son nom au-dessus. */
export default function GroupePastilles({
  legende,
  children,
}: {
  legende: string
  children: ReactNode
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-encre">{legende}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}
