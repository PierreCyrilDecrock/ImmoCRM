import { useCallback, useId, useRef, type TextareaHTMLAttributes } from 'react'
import { ajouterDictee } from '../lib/dictee'
import { useDictee } from '../lib/reconnaissance-vocale'
import { CLASSES_CHAMP, descriptionChamp } from './champ-commun'
import EnveloppeChamp from './EnveloppeChamp'
import Icone from './Icone'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> & {
  libelle: string
  aide?: string
  erreur?: string
  /** `false` : pas de bouton de dictée (il s'affiche sinon quand le navigateur sait dicter). */
  dictee?: boolean
}

/**
 * Écrit `valeur` dans le champ comme si elle avait été tapée : le `onChange` du formulaire
 * la reçoit, que le champ soit piloté par React ou non.
 */
function ecrireDansLeChamp(champ: HTMLTextAreaElement, valeur: string) {
  const ecrire = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  if (ecrire === undefined) return
  ecrire.call(champ, valeur)
  champ.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * Champ de saisie sur plusieurs lignes (note, compte rendu) avec son libellé. Un bouton
 * micro, dans le coin du champ, lance la dictée par le navigateur quand il sait le faire ;
 * sinon, le micro du clavier du téléphone reste disponible.
 */
export default function ChampTexteLong({
  libelle,
  aide,
  erreur,
  rows = 4,
  dictee: avecDictee = true,
  ...champ
}: Props) {
  const id = useId()
  const reference = useRef<HTMLTextAreaElement>(null)
  const longueurMax = champ.maxLength
  const ajouter = useCallback(
    (phrase: string) => {
      const element = reference.current
      if (element === null) return
      ecrireDansLeChamp(element, ajouterDictee(element.value, phrase, longueurMax))
      // Le texte dicté reste visible, même dans un long compte rendu.
      element.scrollTop = element.scrollHeight
    },
    [longueurMax],
  )
  const dictee = useDictee(ajouter)
  const micro = avecDictee && dictee.disponible && champ.disabled !== true && !champ.readOnly
  const idEcoute = `${id}-ecoute`

  return (
    <EnveloppeChamp
      id={id}
      libelle={libelle}
      aide={aide}
      erreur={erreur ?? dictee.erreur ?? undefined}
    >
      <div className="relative">
        <textarea
          ref={reference}
          id={id}
          rows={rows}
          className={`${CLASSES_CHAMP} py-2 ${micro ? 'pr-14' : ''}`}
          aria-invalid={erreur !== undefined || undefined}
          aria-describedby={
            [
              descriptionChamp(id, aide, erreur ?? dictee.erreur ?? undefined),
              dictee.ecoute ? idEcoute : null,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
          {...champ}
          // Repère lu par `FenetreModale` pour placer le curseur à l'ouverture.
          data-autofocus={champ.autoFocus === true ? '' : undefined}
        />
        {micro && (
          <button
            type="button"
            onClick={dictee.basculer}
            aria-pressed={dictee.ecoute}
            aria-label={dictee.ecoute ? `Arrêter la dictée : ${libelle}` : `Dicter : ${libelle}`}
            title={dictee.ecoute ? 'Arrêter la dictée' : 'Dicter'}
            className={`absolute right-1 bottom-1 flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              dictee.ecoute
                ? 'animate-pulse bg-danger text-sur-plein'
                : 'text-accent hover:bg-accent-doux'
            }`}
          >
            <Icone nom={dictee.ecoute ? 'arret' : 'micro'} className="size-5" />
          </button>
        )}
      </div>
      {dictee.ecoute && (
        <p id={idEcoute} aria-live="polite" className="mt-1 text-sm text-encre-douce">
          <span className="font-medium text-danger">J’écoute…</span>{' '}
          {dictee.provisoire !== '' ? (
            <span className="italic">« {dictee.provisoire} »</span>
          ) : (
            'Parlez, puis touchez le carré pour arrêter. Dites « virgule », « point final » ou « à la ligne » pour ponctuer.'
          )}
        </p>
      )}
    </EnveloppeChamp>
  )
}
