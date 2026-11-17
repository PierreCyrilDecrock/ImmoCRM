import { useEffect, useRef, useState } from 'react'
import { CLASSES_CHAMP } from '../../components/champ-commun'
import Icone from '../../components/Icone'
import { useNotifications } from '../../components/notifications-contexte'
import { exigerSupabase } from '../../lib/supabase'
import {
  bilanPriorites,
  changerPriorite,
  enregistrerPriorites,
  lirePriorites,
  LONGUEUR_MAX_PRIORITE,
  PRIORITES_VIDES,
  type Priorites,
} from './priorites'

/** `jour` ne change pas pendant la vie du composant : l'écran le recrée avec `key={jour}`. */
type Props = { jour: string }

const RANGS = [0, 1, 2] as const

type Etat = 'lecture' | 'pret' | 'erreur'

/**
 * « Trois actions qui comptent » : choisies chaque matin, écrites librement, cochées au fil
 * de la journée. Chaque action s'enregistre quand on quitte son champ (ou par « Entrée ») ;
 * la case s'enregistre aussitôt. Elles se retrouvent sur tous les appareils.
 */
export default function TroisActions({ jour }: Props) {
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>('lecture')
  // Ce qui est enregistré, et ce qui est en cours de saisie.
  const [enregistrees, setEnregistrees] = useState<Priorites>(PRIORITES_VIDES)
  const [saisies, setSaisies] = useState<Priorites>(PRIORITES_VIDES)
  const [envoi, setEnvoi] = useState(false)
  // Les enregistrements partent l'un après l'autre, dans l'ordre des gestes.
  const file = useRef<Promise<unknown>>(Promise.resolve())

  useEffect(() => {
    let actif = true
    void lirePriorites(exigerSupabase(), jour).then((resultat) => {
      if (!actif) return
      if (!resultat.ok) {
        setEtat('erreur')
        return
      }
      setEnregistrees(resultat.donnees)
      setSaisies(resultat.donnees)
      setEtat('pret')
    })
    return () => {
      actif = false
    }
  }, [jour])

  function enregistrer(suivantes: Priorites) {
    setSaisies(suivantes)
    setEnvoi(true)
    file.current = file.current.then(async () => {
      const resultat = await enregistrerPriorites(exigerSupabase(), jour, suivantes)
      setEnvoi(false)
      if (!resultat.ok) {
        notifier(
          'erreur',
          `Vos trois actions n'ont pas pu être enregistrées. ${resultat.erreur.message}`,
        )
        return
      }
      setEnregistrees(resultat.donnees)
    })
  }

  /** Quitter un champ : enregistre l'action si elle a changé. */
  function valider(rang: 0 | 1 | 2) {
    const texte = saisies[rang].texte.trim()
    if (texte === enregistrees[rang].texte) return
    enregistrer(
      changerPriorite(saisies, rang, { texte, faite: texte === '' ? false : saisies[rang].faite }),
    )
  }

  function cocher(rang: 0 | 1 | 2) {
    const priorite = saisies[rang]
    if (priorite.texte.trim() === '') return
    enregistrer(
      changerPriorite(saisies, rang, { texte: priorite.texte.trim(), faite: !priorite.faite }),
    )
  }

  const bilan = bilanPriorites(enregistrees)

  return (
    <section
      aria-labelledby="trois-actions"
      className="rounded-2xl bg-surface p-4 ring-1 ring-bord"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id="trois-actions" className="text-lg font-semibold text-encre">
          Trois actions qui comptent
        </h2>
        <p className="text-sm text-encre-douce" aria-live="polite">
          {etat === 'lecture'
            ? 'Lecture…'
            : envoi
              ? 'Enregistrement…'
              : bilan.choisies === 0
                ? 'À choisir ce matin'
                : bilan.faites === bilan.choisies
                  ? 'Toutes faites, bravo'
                  : `${bilan.faites} sur ${bilan.choisies} faite${bilan.faites > 1 ? 's' : ''}`}
        </p>
      </div>
      {etat === 'erreur' && (
        <p className="mb-2 text-sm text-danger">
          Vos actions du jour n'ont pas pu être lues. Vérifiez votre connexion, puis rechargez la
          page.
        </p>
      )}
      <ol className="flex flex-col gap-2">
        {RANGS.map((rang) => {
          const priorite = saisies[rang]
          const ecrite = priorite.texte.trim() !== ''
          return (
            <li key={rang} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!ecrite || etat !== 'pret'}
                onClick={() => cocher(rang)}
                aria-pressed={priorite.faite}
                aria-label={
                  priorite.faite
                    ? `Action ${rang + 1} faite : la remettre à faire`
                    : `Marquer l'action ${rang + 1} comme faite`
                }
                className="group flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
              >
                <span
                  className={`flex size-6 items-center justify-center rounded-full border-2 ${
                    priorite.faite
                      ? 'border-succes bg-succes text-sur-plein'
                      : 'border-bord-fort text-transparent group-hover:border-succes group-hover:text-succes'
                  }`}
                >
                  <Icone nom="succes" className="size-4" />
                </span>
              </button>
              <input
                type="text"
                value={priorite.texte}
                maxLength={LONGUEUR_MAX_PRIORITE}
                disabled={etat !== 'pret'}
                enterKeyHint="done"
                autoComplete="off"
                aria-label={`Action ${rang + 1}`}
                placeholder={rang === 0 ? 'La plus importante de la journée' : `Action ${rang + 1}`}
                onChange={(evenement) =>
                  setSaisies(changerPriorite(saisies, rang, { texte: evenement.target.value }))
                }
                onBlur={() => valider(rang)}
                onKeyDown={(evenement) => {
                  if (evenement.key === 'Enter') evenement.currentTarget.blur()
                }}
                className={`${CLASSES_CHAMP} min-w-0 flex-1 ${priorite.faite ? 'text-encre-douce line-through' : ''}`}
              />
            </li>
          )
        })}
      </ol>
    </section>
  )
}
