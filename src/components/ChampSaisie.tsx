import { useId, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> & { libelle: string }

/** Champ de formulaire avec son libellé, assez haut pour être touché du doigt. */
export default function ChampSaisie({ libelle, ...champ }: Props) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {libelle}
      </label>
      <input
        id={id}
        className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 focus:outline-none"
        {...champ}
      />
    </div>
  )
}
