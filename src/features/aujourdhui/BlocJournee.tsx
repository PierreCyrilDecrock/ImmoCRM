import type { ReactNode } from 'react'
import Icone, { type NomIcone } from '../../components/Icone'
import Message from '../../components/Message'
import { idDuBloc } from './journee'

type Props = {
  /**
   * Sert aux identifiants du bloc (`journee-agenda`, où mènent les compteurs de l'en-tête)
   * et de son contenu (`bloc-agenda`).
   */
  cle: string
  titre: string
  /** Petite mention sous le titre (« la plus urgente en premier »). */
  sousTitre?: string
  icone: NomIcone
  /** Nombre d'éléments du bloc ; `null` : pas encore connu (lecture, erreur). */
  compteur: number | null
  /** Le compteur est un signal d'alerte (retard, demande en attente). */
  compteurAlerte?: boolean
  /** Le compteur est un minimum (« 12+ ») : toutes les lignes n'ont pas été lues. */
  compteurPartiel?: boolean
  /** En tête du contenu (un filtre) : affiché même quand le compteur vaut 0. */
  filtre?: ReactNode
  replie: boolean
  onBasculer: () => void
  /** Message d'erreur de lecture du bloc. */
  erreur?: string | null
  /**
   * Message quand le bloc est vide : positif, en vert (`succes`, par défaut), ou `neutre`, en
   * gris avec un compteur gris, quand il reste du travail ailleurs sur l'écran.
   */
  vide: { titre: string; texte: string; ton?: 'succes' | 'neutre' }
  /** Le contenu ; ignoré si le compteur vaut 0. */
  children?: ReactNode
  /** Sous la liste : lien « Voir tout », explication. */
  pied?: ReactNode
}

/**
 * Un bloc de l'écran Aujourd'hui : un titre avec son compteur, qui replie ou déplie le
 * contenu d'un toucher. Vide, il le dit sur un ton positif, ou neutre quand le reste de
 * l'écran a encore du travail (le vert ne contredit jamais une pastille de retard).
 */
export default function BlocJournee({
  cle,
  titre,
  sousTitre,
  icone,
  compteur,
  compteurAlerte = false,
  compteurPartiel = false,
  filtre,
  replie,
  onBasculer,
  erreur = null,
  vide,
  children,
  pied,
}: Props) {
  const idContenu = `bloc-${cle}`
  const neutre = vide.ton === 'neutre'
  const couleurCompteur =
    compteur === 0
      ? neutre
        ? 'bg-creux text-encre-douce'
        : 'bg-succes-doux text-succes'
      : compteurAlerte
        ? 'bg-danger-doux text-danger'
        : 'bg-accent-doux text-accent-fort'

  return (
    <section id={idDuBloc(cle)} className="scroll-mt-4 rounded-2xl bg-surface ring-1 ring-bord">
      <h2>
        <button
          type="button"
          onClick={onBasculer}
          aria-expanded={!replie}
          aria-controls={idContenu}
          className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-2 text-left hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Icone nom={icone} className="size-6 text-encre-douce" />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold text-encre">{titre}</span>
            {sousTitre !== undefined && (
              <span className="block text-sm text-encre-douce">{sousTitre}</span>
            )}
          </span>
          {compteur !== null && (
            <span
              className={`min-w-8 rounded-full px-2.5 py-0.5 text-center text-sm font-bold tabular-nums ${couleurCompteur}`}
            >
              {compteurPartiel ? (
                <>
                  <span aria-hidden="true">{compteur}+</span>
                  <span className="sr-only">au moins {compteur}</span>
                </>
              ) : (
                compteur
              )}
              <span className="sr-only"> {compteur > 1 ? 'éléments' : 'élément'}</span>
            </span>
          )}
          <Icone
            nom="chevron"
            className={`size-5 text-encre-douce transition-transform ${replie ? '' : 'rotate-90'}`}
          />
        </button>
      </h2>
      {!replie && (
        <div id={idContenu} className="px-4 pb-4">
          {erreur === null && filtre !== undefined && <div className="mb-2">{filtre}</div>}
          {erreur !== null ? (
            <Message genre="erreur">Ce bloc n'a pas pu être lu. {erreur}</Message>
          ) : compteur === 0 ? (
            <div
              className={`flex items-start gap-3 rounded-xl px-3 py-3 ${neutre ? 'bg-creux' : 'bg-succes-doux'}`}
            >
              <Icone
                nom={neutre ? 'info' : 'succes'}
                className={`mt-0.5 size-5 ${neutre ? 'text-encre-douce' : 'text-succes'}`}
              />
              <p className="text-sm text-encre">
                <span className="font-semibold">{vide.titre}</span> {vide.texte}
              </p>
            </div>
          ) : (
            <>
              {children}
              {pied}
            </>
          )}
        </div>
      )}
    </section>
  )
}
