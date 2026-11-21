import { useEffect, useState } from 'react'
import { copierTexte } from '../lib/presse-papiers'
import Icone from './Icone'
import { useNotifications } from './notifications-contexte'
import { VISIBLE_AU_SURVOL } from './survol'

type Props = {
  /** Le texte copié, tel qu'on le collera ailleurs. */
  valeur: string
  /** Ce qui est copié, pour les lecteurs d'écran : « le numéro », « l'adresse »… */
  quoi: string
}

/** Durée pendant laquelle le bouton dit « Copié ». */
const DUREE_COPIE_MS = 2000

/**
 * Petit bouton « Copier » à côté d'un numéro, d'un courriel ou d'une adresse. Il copie la
 * valeur et dit « Copié » deux secondes, annoncé aux lecteurs d'écran. Sur ordinateur, il
 * n'apparaît qu'au survol de sa ligne (qui porte `group/ligne`) ou au clavier ; sur un écran
 * tactile, il est toujours visible. Si le navigateur refuse la copie, un message le dit.
 */
export default function BoutonCopier({ valeur, quoi }: Props) {
  const { notifier } = useNotifications()
  const [copie, setCopie] = useState(false)

  useEffect(() => {
    if (!copie) return
    const minuterie = window.setTimeout(() => setCopie(false), DUREE_COPIE_MS)
    return () => window.clearTimeout(minuterie)
  }, [copie])

  async function copier() {
    if (await copierTexte(valeur)) {
      setCopie(true)
      return
    }
    notifier(
      'erreur',
      'Le navigateur a refusé la copie. Sélectionnez le texte en le touchant longuement (ou à la souris), puis copiez-le.',
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void copier()}
        aria-label={`Copier ${quoi}`}
        className={`inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold hover:bg-accent-doux focus-visible:outline-2 focus-visible:outline-accent ${
          copie ? 'text-succes' : `text-accent ${VISIBLE_AU_SURVOL}`
        }`}
      >
        <Icone nom={copie ? 'succes' : 'copier'} className="size-4" />
        {copie ? 'Copié' : 'Copier'}
      </button>
      <span className="sr-only" aria-live="polite">
        {copie ? 'Copié dans le presse-papiers.' : ''}
      </span>
    </>
  )
}
