import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { CLASSES_CHAMP } from '../../components/champ-commun'
import Icone from '../../components/Icone'
import { useNotifications } from '../../components/notifications-contexte'
import { exigerSupabase } from '../../lib/supabase'
import {
  bilanPriorites,
  changerPriorite,
  enregistrerPriorites,
  EXEMPLES_PRIORITES,
  formeTroisActions,
  lirePriorites,
  memoriserUtilisees,
  LONGUEUR_MAX_PRIORITE,
  NOMS_PRIORITES,
  PRIORITES_VIDES,
  type Priorites,
  utiliseesMemorisees,
} from './priorites'

/** `jour` ne change pas pendant la vie du composant : l'écran le recrée avec `key={jour}`. */
type Props = { jour: string }

const RANGS = [0, 1, 2] as const

type Etat = 'lecture' | 'pret' | 'erreur'

type Rang = (typeof RANGS)[number]

/**
 * « Trois actions qui comptent » : choisies chaque matin, écrites librement, cochées au fil
 * de la journée. Tant qu'aucune action n'a jamais été écrite, le bloc tient en une ligne
 * « Choisir mes trois actions du jour » qui déplie les champs (`formeTroisActions`) ; dès la
 * première action écrite, il garde ses trois champs, les jours suivants aussi. Un champ vide
 * montre un exemple. Chaque action s'enregistre quand on quitte
 * son champ (ou par « Entrée ») ; elle s'affiche alors en texte, sans bordure, avec sa case
 * ronde ; la toucher (ou « Entrée » au clavier) la rend de nouveau modifiable, « Échap »
 * abandonne la correction. La case s'enregistre aussitôt. Elles se retrouvent sur tous les
 * appareils.
 */
export default function TroisActions({ jour }: Props) {
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>('lecture')
  // Ce qui est enregistré, et ce qui est en cours de saisie.
  const [enregistrees, setEnregistrees] = useState<Priorites>(PRIORITES_VIDES)
  const [saisies, setSaisies] = useState<Priorites>(PRIORITES_VIDES)
  const [envoi, setEnvoi] = useState(false)
  // Les actions ont déjà servi (ce jour-ci ou avant) : le bloc garde ses trois champs.
  const [dejaUtilisees, setDejaUtilisees] = useState(utiliseesMemorisees)
  // La ligne « Choisir mes trois actions du jour » a été touchée.
  const [deplie, setDeplie] = useState(false)
  // Les enregistrements partent l'un après l'autre, dans l'ordre des gestes.
  const file = useRef<Promise<unknown>>(Promise.resolve())
  // L'action en cours de saisie : elle garde son champ, même une fois écrite.
  const [edition, setEdition] = useState<Rang | null>(null)
  const champs = useRef<(HTMLInputElement | null)[]>([])
  const textes = useRef<(HTMLButtonElement | null)[]>([])
  // Après « Entrée » ou « Échap », le clavier revient sur l'action affichée en texte.
  const aRendre = useRef<Rang | null>(null)
  // « Échap » : le champ se referme sans enregistrer.
  const abandon = useRef(false)

  // Toucher une action écrite ouvre son champ, le curseur à la fin du texte (aussitôt, pour
  // que le clavier du téléphone s'ouvre dans la foulée du toucher).
  useLayoutEffect(() => {
    if (edition === null) return
    const champ = champs.current[edition]
    if (champ === null || champ === undefined || document.activeElement === champ) return
    champ.focus()
    champ.setSelectionRange(champ.value.length, champ.value.length)
  }, [edition])

  useLayoutEffect(() => {
    if (edition !== null || aRendre.current === null) return
    textes.current[aRendre.current]?.focus()
    aRendre.current = null
  })

  useEffect(() => {
    let actif = true
    void lirePriorites(exigerSupabase(), jour).then((resultat) => {
      if (!actif) return
      if (!resultat.ok) {
        setEtat('erreur')
        return
      }
      setEnregistrees(resultat.donnees.priorites)
      setSaisies(resultat.donnees.priorites)
      setDejaUtilisees(resultat.donnees.dejaUtilisees)
      if (resultat.donnees.dejaUtilisees) memoriserUtilisees()
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
      setDejaUtilisees(true)
      memoriserUtilisees()
    })
  }

  /** Quitter un champ : enregistre l'action si elle a changé, et la montre en texte. */
  function quitter(rang: Rang) {
    setEdition((courante) => (courante === rang ? null : courante))
    if (abandon.current) {
      abandon.current = false
      return
    }
    valider(rang)
  }

  function touche(rang: Rang, evenement: KeyboardEvent<HTMLInputElement>) {
    if (evenement.key === 'Enter') {
      // Sans cela, la même touche « cliquerait » le texte qui prend le focus, et rouvrirait
      // aussitôt le champ.
      evenement.preventDefault()
      aRendre.current = rang
      evenement.currentTarget.blur()
    } else if (evenement.key === 'Escape') {
      evenement.preventDefault()
      abandon.current = true
      aRendre.current = rang
      setSaisies(changerPriorite(saisies, rang, { texte: enregistrees[rang].texte }))
      evenement.currentTarget.blur()
    }
  }

  function valider(rang: Rang) {
    const texte = saisies[rang].texte.trim()
    if (texte === enregistrees[rang].texte) return
    enregistrer(
      changerPriorite(saisies, rang, { texte, faite: texte === '' ? false : saisies[rang].faite }),
    )
  }

  function cocher(rang: Rang) {
    const priorite = saisies[rang]
    if (priorite.texte.trim() === '') return
    enregistrer(
      changerPriorite(saisies, rang, { texte: priorite.texte.trim(), faite: !priorite.faite }),
    )
  }

  const bilan = bilanPriorites(enregistrees)
  const forme = formeTroisActions({
    erreur: etat === 'erreur',
    choisies: bilan.choisies,
    dejaUtilisees,
    deplie,
  })

  if (forme === 'ligne') {
    return (
      <section aria-label="Trois actions qui comptent">
        <button
          type="button"
          aria-expanded={false}
          disabled={etat !== 'pret'}
          onClick={() => {
            setDeplie(true)
            setEdition(0)
          }}
          className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-surface px-4 py-2 text-left ring-1 ring-bord hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-wait"
        >
          <Icone nom="ajouter" className="size-6 text-accent" />
          <span className="min-w-0 flex-1 text-base font-semibold text-encre">
            Choisir mes trois actions du jour
          </span>
          <Icone nom="chevron" className="size-5 text-encre-douce" />
        </button>
      </section>
    )
  }

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
      <ol className="flex flex-col gap-1">
        {RANGS.map((rang) => {
          const priorite = saisies[rang]
          const texte = priorite.texte.trim()
          const ecrite = texte !== ''
          // Écrite : en texte ; vide ou en cours de saisie : un champ.
          const enTexte = ecrite && edition !== rang
          return (
            <li key={rang} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!ecrite || etat !== 'pret'}
                onClick={() => cocher(rang)}
                aria-pressed={priorite.faite}
                aria-label={
                  !ecrite
                    ? `${NOMS_PRIORITES[rang]} : à écrire d'abord`
                    : priorite.faite
                      ? `« ${texte} » est faite : la remettre à faire`
                      : `Marquer « ${texte} » comme faite`
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
              {enTexte ? (
                <button
                  type="button"
                  ref={(bouton) => {
                    textes.current[rang] = bouton
                  }}
                  disabled={etat !== 'pret'}
                  onClick={() => setEdition(rang)}
                  className={`min-h-11 min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-base break-words hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent ${priorite.faite ? 'text-encre-douce line-through' : 'text-encre'}`}
                >
                  {texte}
                  <span className="sr-only"> ({NOMS_PRIORITES[rang].toLowerCase()}, modifier)</span>
                </button>
              ) : (
                <input
                  type="text"
                  ref={(champ) => {
                    champs.current[rang] = champ
                  }}
                  value={priorite.texte}
                  maxLength={LONGUEUR_MAX_PRIORITE}
                  disabled={etat !== 'pret'}
                  enterKeyHint="done"
                  autoComplete="off"
                  aria-label={NOMS_PRIORITES[rang]}
                  placeholder={EXEMPLES_PRIORITES[rang]}
                  onFocus={() => setEdition(rang)}
                  onChange={(evenement) =>
                    setSaisies(changerPriorite(saisies, rang, { texte: evenement.target.value }))
                  }
                  onBlur={() => quitter(rang)}
                  onKeyDown={(evenement) => touche(rang, evenement)}
                  className={`${CLASSES_CHAMP} min-w-0 flex-1 ${priorite.faite ? 'text-encre-douce line-through' : ''}`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
