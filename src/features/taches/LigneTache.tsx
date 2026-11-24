import Bouton from '../../components/Bouton'
import Etiquette from '../../components/Etiquette'
import Icone from '../../components/Icone'
import LigneGlissable from '../../components/LigneGlissable'
import { VISIBLE_AU_SURVOL } from '../../components/survol'
import { formaterDate } from '../../lib/dates'
import { useSurvolPossible } from '../../lib/ecran'
import CaseTache from './CaseTache'
import { detailLigneTache } from './ligne-tache'
import { libelleRecurrence } from './recurrence'
import ReportsRapides from './ReportsRapides'
import { genreEtatTache, libelleEtatTache, type TacheAffichee } from './taches'

type Props = {
  affichee: TacheAffichee
  aujourdhui: string
  /** Lien à ne pas répéter (la fiche sur laquelle la liste est affichée). */
  masquer?: 'contact' | 'bien'
  /**
   * Le jour que l'onglet affiché dit déjà (`jourDeLaVue` : aujourd'hui dans l'onglet
   * Aujourd'hui) : il ne s'écrit pas sur la ligne.
   */
  jourMasque?: string | null
  /** Une action est en cours sur cette tâche : ses boutons sont inactifs. */
  occupee: boolean
  onCocher: () => void
  /** Ouvre la fenêtre de report (calendrier). */
  onReporter: () => void
  onOuvrir: () => void
  onRouvrir: () => void
  /**
   * Reports en un geste (demain, dans 3 jours, lundi) : sur écran tactile, derrière le bouton
   * horloge replié ; sur ordinateur, en rangée au survol et au clavier. La ligne se glisse
   * aussi au doigt (« Reporter », « Fait »). Absent : un bouton « Reporter » qui ouvre la
   * fenêtre.
   */
  onReporterA?: (echeance: string) => void
  /**
   * La ligne se glisse au doigt (« Reporter », « Fait ») même sans reports en un geste. Par
   * défaut : avec `onReporterA`.
   */
  glissable?: boolean
  /**
   * L'échéance à afficher à droite (« Hier », « 17 h 30 »), en chiffres alignés, à la place
   * du jour dans le détail. Vide : rien à droite (le titre du groupe dit déjà le jour).
   */
  echeanceADroite?: string
}

/**
 * Une tâche dans une liste (étape E.3) : la case ronde à gauche (faite en un geste, ou la
 * boucle de relance), le titre et une seule ligne de détail (`detailLigneTache` : le jour
 * s'il diffère de l'onglet, l'heure en gras, le contact, une seule adresse), le toucher
 * ouvre la tâche ; à droite, un seul geste : Reporter. Une tâche close montre son état et
 * propose de la rouvrir.
 */
export default function LigneTache({
  affichee,
  aujourdhui,
  masquer,
  jourMasque = null,
  occupee,
  onCocher,
  onReporter,
  onOuvrir,
  onRouvrir,
  onReporterA,
  glissable,
  echeanceADroite,
}: Props) {
  const survol = useSurvolPossible()
  const { tache } = affichee
  const aFaire = tache.etat === 'a_faire'
  const recurrence = libelleRecurrence(tache.recurrence)
  const jourADroite = echeanceADroite !== undefined
  const detail = detailLigneTache(affichee, {
    aujourdhui,
    masquer,
    // L'échéance à droite remplace le jour du détail.
    jourMasque: jourADroite ? tache.echeance : jourMasque,
  })
  const rapide = aFaire && onReporterA !== undefined
  const seGlisse = aFaire && (glissable ?? onReporterA !== undefined)
  // La ligne de détail, morceau par morceau (priorité, jour, heure en gras, contact, adresse).
  const morceaux = [
    aFaire && tache.priorite === 1
      ? { cle: 'priorite', texte: 'Priorité haute', classe: 'font-semibold text-danger' }
      : null,
    detail.jour !== null
      ? {
          cle: 'jour',
          texte: detail.jour,
          classe: detail.enRetard ? 'font-semibold text-danger' : undefined,
        }
      : null,
    detail.horaire !== '' && !jourADroite
      ? { cle: 'horaire', texte: detail.horaire, classe: 'font-semibold text-encre' }
      : null,
    ...detail.autres.map((texte, rang) => ({ cle: `autre-${rang}`, texte, classe: undefined })),
  ].filter((morceau) => morceau !== null)

  const contenu = (
    <div
      className={`flex items-center gap-1 py-1 pr-2 pl-1 ${survol ? 'group-focus-within/ligne:bg-creux group-hover/ligne:bg-creux' : ''}`}
    >
      {aFaire ? (
        <CaseTache titre={tache.titre} occupee={occupee} onCocher={onCocher} />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center text-encre-douce">
          <Icone nom={tache.etat === 'faite' ? 'succes' : 'fermer'} className="size-6" />
        </span>
      )}

      <div className="relative flex min-w-0 flex-1">
        <button
          type="button"
          onClick={onOuvrir}
          className={`min-w-0 flex-1 rounded-lg py-2 text-left focus-visible:outline-2 focus-visible:outline-accent ${survol ? '' : 'active:bg-creux'}`}
        >
          <span className="flex items-start gap-1.5">
            <span
              className={`line-clamp-2 min-w-0 text-base font-medium break-words ${aFaire ? 'text-encre' : 'text-encre-douce line-through'}`}
            >
              {tache.titre}
            </span>
            {recurrence !== null && (
              <span title={recurrence} className="mt-1 shrink-0 text-encre-douce">
                <Icone nom="repeter" className="size-4" />
                <span className="sr-only">, {recurrence}</span>
              </span>
            )}
          </span>
          <span className="block truncate text-sm text-encre-douce">
            {morceaux.map((morceau, rang) => (
              <span key={morceau.cle} className={morceau.classe}>
                {rang > 0 && <span className="font-normal text-encre-douce"> · </span>}
                {morceau.texte}
              </span>
            ))}
          </span>
          {!aFaire && (
            <span className="mt-1 flex">
              <Etiquette genre={genreEtatTache(tache.etat)}>
                {libelleEtatTache(tache.etat)} le {formaterDate(tache.cloturee_le)}
              </Etiquette>
            </span>
          )}
        </button>

        {/* Ordinateur : les reports en un geste viennent par-dessus la fin du texte. */}
        {rapide && survol && (
          <div className={`absolute inset-y-0 right-0 flex ${VISIBLE_AU_SURVOL}`}>
            <span aria-hidden="true" className="w-6 bg-linear-to-r from-transparent to-creux" />
            <div className="flex items-center bg-creux pl-1">
              <ReportsRapides
                aujourdhui={aujourdhui}
                titre={tache.titre}
                desactive={occupee}
                onReporter={onReporterA}
                onAutreDate={onReporter}
              />
            </div>
          </div>
        )}
      </div>

      {jourADroite && echeanceADroite !== '' && (
        <span
          className={`flex min-h-11 shrink-0 items-center text-sm tabular-nums ${detail.enRetard ? 'font-semibold text-danger' : 'font-medium text-encre'}`}
        >
          {echeanceADroite}
        </span>
      )}

      {!aFaire ? (
        <Bouton variante="discret" disabled={occupee} onClick={onRouvrir}>
          Rouvrir
        </Bouton>
      ) : rapide ? (
        !survol && (
          <ReportsRapides
            replie
            aujourdhui={aujourdhui}
            titre={tache.titre}
            desactive={occupee}
            onReporter={onReporterA}
            onAutreDate={onReporter}
          />
        )
      ) : (
        <Bouton
          variante="discret"
          icone="horloge"
          disabled={occupee}
          onClick={onReporter}
          aria-label={`Reporter « ${tache.titre} »`}
        >
          <span className="hidden sm:inline">Reporter</span>
        </Bouton>
      )}
    </div>
  )

  if (!seGlisse) return <li className="group/ligne">{contenu}</li>
  return (
    <LigneGlissable
      className="group/ligne"
      desactivee={occupee}
      actions={[
        { libelle: 'Reporter', icone: 'horloge', genre: 'alerte', onAction: onReporter },
        { libelle: 'Fait', icone: 'succes', genre: 'succes', onAction: onCocher },
      ]}
    >
      {contenu}
    </LigneGlissable>
  )
}
