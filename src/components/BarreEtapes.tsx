import type { EtatEtape } from '../lib/etapes'
import Bouton from './Bouton'

type Props = {
  /** Les étapes dans l'ordre, avec leur état (`etatsEtapes`, `src/lib/etapes.ts`). */
  etapes: readonly { valeur: string; libelle: string; etat: EtatEtape }[]
  /** L'ancienneté dans l'étape (« Depuis 12 jours ») ; `alerte` : elle traîne. */
  anciennete?: { texte: string; alerte: boolean }
  /** « Pour passer à l'étape suivante (Estimation) : projet, délai, motif. » */
  critere?: string
  /** « Il manque le motif de la vente. » */
  manque?: string
  /** Le bouton « Étape suivante » ; absent, pas de bouton (dernière étape, projet clos). */
  suivante?: { libelle: string; onPasser: () => void; desactive?: boolean }
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
 * Les étapes d'un projet en barre : un segment par étape (passées en bleu clair, celle en
 * cours en bleu franc, à venir en gris), son nom dessous ; puis l'ancienneté dans l'étape, ce
 * qu'il faut pour passer à la suivante, et le bouton « Étape suivante ». Sur la fiche du
 * projet (`choix`), un toucher sur une étape y fait passer. Sans logique métier : la page
 * donne les étapes, le critère et le geste (`useChangementEtape`).
 */
export default function BarreEtapes({
  etapes,
  anciennete,
  critere,
  manque,
  suivante,
  choix,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <ol
        aria-label="Étapes du projet"
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${etapes.length}, minmax(0, 1fr))` }}
      >
        {etapes.map((etape) => {
          const contenu = (
            <>
              <span
                aria-hidden="true"
                className={`h-1.5 w-full rounded-full ${COULEUR_SEGMENT[etape.etat]}`}
              />
              <span
                // Coupé à la française (avec un tiret) plutôt que tronqué : la colonne du profil
                // est étroite, le nom de chaque étape reste lisible en entier.
                className={`w-full text-xs leading-tight break-words hyphens-auto ${
                  etape.etat === 'en_cours' ? 'font-semibold text-encre' : 'text-encre-douce'
                }`}
                title={etape.libelle}
              >
                {etape.libelle}
                <span className="sr-only">, {ANNONCE[etape.etat]}</span>
              </span>
            </>
          )
          return (
            <li
              key={etape.valeur}
              aria-current={etape.etat === 'en_cours' ? 'step' : undefined}
              className="flex min-w-0 flex-col gap-1"
            >
              {choix === undefined ? (
                contenu
              ) : (
                <button
                  type="button"
                  disabled={etape.etat === 'en_cours' || choix.desactive}
                  onClick={() => choix.onChoisir(etape.valeur)}
                  aria-label={
                    etape.etat === 'en_cours'
                      ? `${etape.libelle}, étape en cours`
                      : `Passer à l’étape « ${etape.libelle} »`
                  }
                  className="flex min-h-11 min-w-0 flex-col items-start justify-center gap-1 rounded-lg px-0.5 text-left hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:hover:bg-transparent"
                >
                  {contenu}
                </button>
              )}
            </li>
          )
        })}
      </ol>
      {anciennete !== undefined && (
        <p
          className={`text-sm ${anciennete.alerte ? 'font-semibold text-alerte' : 'text-encre-douce'}`}
        >
          {anciennete.texte}
        </p>
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
            variante="secondaire"
            icone="chevron"
            disabled={suivante.desactive}
            onClick={suivante.onPasser}
            aria-label={`Étape suivante : ${suivante.libelle}`}
          >
            Étape suivante
          </Bouton>
        </div>
      )}
    </div>
  )
}
