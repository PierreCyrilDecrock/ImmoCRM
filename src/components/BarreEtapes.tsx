import { useId } from 'react'
import type { CritereSortie, EtatEtape } from '../lib/etapes'
import { useSurvolPossible } from '../lib/ecran'
import Bouton from './Bouton'
import Icone from './Icone'

type Props = {
  /** Les étapes dans l'ordre, avec leur état (`etatsEtapes`, `src/lib/etapes.ts`). */
  etapes: readonly { valeur: string; libelle: string; etat: EtatEtape }[]
  /**
   * L'ancienneté dans l'étape, collée à son nom (« Découverte · 12 j ») : `court` s'affiche,
   * `texte` (« Depuis 12 jours ») est lu par les lecteurs d'écran ; `alerte` : elle traîne.
   */
  anciennete?: { court: string; texte: string; alerte: boolean }
  /**
   * Fiche du projet : ce qu'il faut pour passer à l'étape suivante, en liste, chaque critère
   * acquis (coche verte) ou manquant (rond vide), sous le titre « Pour passer à Estimation ».
   */
  passage?: { titre: string; criteres: readonly CritereSortie[] }
  /** Rubrique d'une fiche Contact ou Bien, en phrase : « Pour passer à l'étape suivante… ». */
  critere?: string
  /** « Il manque le motif de la vente. » (avec `critere`) */
  manque?: string
  /**
   * Le bouton qui nomme l'étape d'arrivée (« Passer à Estimation ») ; absent, pas de bouton
   * (dernière étape, projet clos). `principal` : l'action de l'écran (fiche du projet), en bleu.
   */
  suivante?: { libelle: string; onPasser: () => void; desactive?: boolean; principal?: boolean }
  /**
   * Fiche du projet : chaque étape devient un bouton (44 px de haut) qui y fait passer,
   * en avant comme en arrière. Absent : la barre se lit seulement.
   */
  choix?: { onChoisir: (valeur: string) => void; desactive?: boolean }
}

const COULEUR_SEGMENT: Record<EtatEtape, string> = {
  passee: 'bg-accent/45',
  en_cours: 'bg-accent',
  a_venir: 'bg-bord-fort/40',
}

const ANNONCE: Record<EtatEtape, string> = {
  passee: 'étape passée',
  en_cours: 'étape en cours',
  a_venir: 'à venir',
}

/**
 * Largeur des colonnes : toutes égales quand la place le permet ; sur un écran étroit, chaque
 * colonne garde au moins la largeur de son mot le plus long (« Premier contact » passe sur deux
 * lignes, jamais « Esti-mation »), et les plus courtes cèdent la place. Les cinq étapes d'une
 * vente tiennent ainsi dès 360 px de large ; en dessous seulement, un nom peut se couper avec
 * un tiret.
 */
const COLONNE = 'minmax(min-content, 1fr)'

/**
 * Les étapes d'un projet en frise : un segment par étape (passées en bleu clair, celle en
 * cours en bleu franc, à venir en gris), son nom dessous en 14 px, l'étape en cours en gras
 * avec son ancienneté (« Découverte · 12 j ») ; puis ce qu'il faut pour passer à la suivante
 * (liste de critères sur la fiche du projet, phrase ailleurs) et le bouton « Passer à … ».
 * Sur la fiche du projet (`choix`), un toucher sur une étape y fait passer ; l'aide « Touchez
 * une étape pour y passer » ne s'affiche que sur écran tactile. Sans logique métier : la page
 * donne les étapes, les critères et le geste (`useChangementEtape`).
 */
export default function BarreEtapes({
  etapes,
  anciennete,
  passage,
  critere,
  manque,
  suivante,
  choix,
}: Props) {
  const survol = useSurvolPossible()
  const id = useId()
  return (
    <div className="flex flex-col gap-3">
      <ol
        aria-label="Étapes du projet"
        className="grid gap-0.5 md:gap-1"
        style={{ gridTemplateColumns: `repeat(${etapes.length}, ${COLONNE})` }}
      >
        {etapes.map((etape) => {
          const enCours = etape.etat === 'en_cours'
          const contenu = (
            <>
              <span
                aria-hidden="true"
                className={`h-1.5 w-full rounded-full ${COULEUR_SEGMENT[etape.etat]}`}
              />
              <span
                // Coupé entre deux mots seulement, jamais au milieu d'un mot (pas de tiret).
                className={`w-full text-sm leading-tight break-words ${
                  enCours ? 'font-semibold text-encre' : 'text-encre-douce max-[359px]:hyphens-auto'
                }`}
              >
                {etape.libelle}
                {enCours && anciennete !== undefined && (
                  // « Découverte · 12 j » ; au téléphone, l'ancienneté passe sous le nom.
                  <span
                    className={`whitespace-nowrap max-md:block ${
                      anciennete.alerte ? 'text-alerte' : 'font-normal text-encre-douce'
                    }`}
                  >
                    <span aria-hidden="true" className="max-md:hidden">
                      {' · '}
                    </span>
                    <span aria-hidden="true">{anciennete.court}</span>
                    <span className="sr-only">
                      , {anciennete.texte.toLocaleLowerCase('fr')}
                      {anciennete.alerte ? ', l’étape traîne' : ''}
                    </span>
                  </span>
                )}
                <span className="sr-only">, {ANNONCE[etape.etat]}</span>
              </span>
            </>
          )
          return (
            <li
              key={etape.valeur}
              aria-current={enCours ? 'step' : undefined}
              className="flex min-w-0 flex-col gap-1"
            >
              {choix === undefined ? (
                contenu
              ) : (
                <button
                  type="button"
                  disabled={enCours || choix.desactive}
                  onClick={() => choix.onChoisir(etape.valeur)}
                  aria-label={
                    enCours
                      ? `${etape.libelle}, étape en cours${
                          anciennete === undefined
                            ? ''
                            : `, ${anciennete.texte.toLocaleLowerCase('fr')}`
                        }`
                      : `Passer à l’étape « ${etape.libelle} »`
                  }
                  className="flex min-h-11 min-w-0 flex-col items-start justify-center gap-1 rounded-lg text-left md:px-0.5 hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:hover:bg-transparent"
                >
                  {contenu}
                </button>
              )}
            </li>
          )
        })}
      </ol>
      {choix !== undefined && !survol && (
        <p className="-mt-1 text-sm text-encre-douce">Touchez une étape pour y passer.</p>
      )}
      {passage !== undefined && passage.criteres.length > 0 && (
        <section aria-labelledby={`${id}-passage`} className="flex flex-col gap-1.5">
          <h3 id={`${id}-passage`} className="text-base font-semibold text-encre">
            {passage.titre}
          </h3>
          <ul className="flex flex-col gap-1.5">
            {passage.criteres.map((critereSortie) => (
              <li key={critereSortie.libelle} className="flex items-start gap-2 text-base">
                {critereSortie.acquis ? (
                  <Icone nom="succes" className="mt-0.5 size-5 shrink-0 text-succes" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="mt-[0.1875rem] ml-0.5 size-4 shrink-0 rounded-full border-2 border-bord-fort"
                  />
                )}
                <span className={critereSortie.acquis ? 'text-encre-douce' : 'text-encre'}>
                  {critereSortie.libelle}
                  <span className="sr-only">
                    {critereSortie.acquis ? ' : acquis' : ' : manquant'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {(critere !== undefined || manque !== undefined) && (
        <p className="text-sm text-encre">
          {critere}
          {manque !== undefined && manque !== '' && (
            <span className="block text-encre-douce">{manque}</span>
          )}
        </p>
      )}
      {suivante !== undefined && (
        <div className="self-start">
          <Bouton
            variante={suivante.principal === true ? 'principal' : 'secondaire'}
            disabled={suivante.desactive}
            onClick={suivante.onPasser}
          >
            Passer à {suivante.libelle}
          </Bouton>
        </div>
      )}
    </div>
  )
}
