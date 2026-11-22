import { Link } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import Icone from '../../components/Icone'
import LigneGlissable from '../../components/LigneGlissable'
import { VISIBLE_AU_SURVOL } from '../../components/survol'
import { nomComplet } from '../contacts/contacts'
import { initialesDe } from '../saisie/recents'
import ReportsRapides from '../taches/ReportsRapides'
import BoutonAppel from './BoutonAppel'
import { enUneLigne } from './journee'
import type { Relance } from './lecture-journee'
import { dernierEchange, pastilleRetard, rolesDuContact } from './ordre-journee'

type Props = {
  relance: Relance
  aujourdhui: string
  occupee: boolean
  /** Ouvre la boucle de relance : résultat, compte rendu, prochaine action. */
  onConsigner: () => void
  /** Ouvre la fenêtre de report (délais et calendrier). */
  onReporter: () => void
  /** Reporte aussitôt à cette date, avec « Annuler » dans la confirmation. */
  onReporterA: (echeance: string) => void
  onOuvrir: () => void
}

/** Sur un appareil à souris seulement (ordinateur) ; caché sur écran tactile. */
const SOURIS_SEULEMENT = 'hidden [@media(hover:hover)]:inline-flex'
/** Sur écran tactile seulement : sur ordinateur, les reports en un geste le remplacent. */
const TACTILE_SEULEMENT = 'inline-flex [@media(hover:hover)]:hidden'

/**
 * Un contact à rappeler. En tête, ses initiales, son nom, son rôle et le retard en pastille
 * rouge ; puis le motif (le titre de la tâche) en texte principal, et le dernier échange.
 * « Appeler » compose le numéro et ouvre aussitôt la saisie du résultat ; « Consigner »
 * l'ouvre sans appeler. Sur ordinateur, les reports en un geste et « Fait » apparaissent au
 * survol ou au clavier ; sur téléphone, la ligne se glisse pour découvrir « Reporter » et
 * « Fait », et le bouton « Reporter » reste visible.
 */
export default function LigneRelance({
  relance,
  aujourdhui,
  occupee,
  onConsigner,
  onReporter,
  onReporterA,
  onOuvrir,
}: Props) {
  const { tache, contact, derniere } = relance
  const retard = pastilleRetard(tache.echeance, aujourdhui)
  const motif = enUneLigne(tache.motif)
  const initiales = contact === null ? '' : initialesDe(nomComplet(contact))

  return (
    <LigneGlissable
      className="group/ligne"
      desactivee={occupee}
      actions={[
        { libelle: 'Reporter', icone: 'horloge', genre: 'alerte', onAction: onReporter },
        { libelle: 'Fait', icone: 'succes', genre: 'succes', onAction: onConsigner },
      ]}
    >
      <div className="py-2 pr-3 pl-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-doux text-xs font-semibold text-accent-fort"
          >
            {initiales === '' ? <Icone nom="telephone" className="size-4" /> : initiales}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              {contact === null ? (
                <p className="flex min-h-11 items-center text-sm text-encre-douce">Sans contact</p>
              ) : (
                <Link
                  to={`/contacts/${contact.id}`}
                  className="group/nom flex min-h-11 min-w-0 flex-col justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="text-sm font-semibold break-words text-encre underline-offset-2 group-hover/nom:underline">
                    {nomComplet(contact)}
                  </span>
                  <span className="text-[0.8125rem] text-encre-douce">
                    <span className="sr-only">, </span>
                    {rolesDuContact(contact)}
                  </span>
                </Link>
              )}
              {retard !== null && (
                <span className="mt-1 shrink-0 rounded-full bg-danger-doux px-2.5 py-0.5 text-[0.8125rem] font-semibold whitespace-nowrap text-danger tabular-nums">
                  <span aria-hidden="true">{retard.texte}</span>
                  <span className="sr-only">{retard.annonce}</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onOuvrir}
              className="mt-1 flex min-h-11 w-full flex-col justify-center rounded-lg text-left hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span className="block text-base font-semibold break-words text-encre">
                {tache.titre}
              </span>
              {motif !== '' && (
                <span className="block truncate text-sm text-encre-douce">{motif}</span>
              )}
            </button>
            {contact !== null && (
              <p className="mt-0.5 flex items-start gap-1 text-sm text-encre-douce">
                <Icone nom="journal" className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 break-words">{dernierEchange(derniere, aujourdhui)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Sur toute la largeur sur téléphone ; alignés sous le texte au-delà. */}
        <div className="mt-2 flex flex-wrap items-center gap-2 sm:pl-12">
          {contact !== null && <BoutonAppel contact={contact} onAppel={onConsigner} />}
          <Bouton variante="secondaire" icone="journal" disabled={occupee} onClick={onConsigner}>
            <span className="text-sm">{contact === null ? 'Fait' : 'Consigner'}</span>
          </Bouton>
          <span className={TACTILE_SEULEMENT}>
            <Bouton
              variante="discret"
              icone="horloge"
              disabled={occupee}
              onClick={onReporter}
              aria-label={`Reporter « ${tache.titre} »`}
            >
              <span className="hidden text-sm sm:inline">Reporter</span>
            </Bouton>
          </span>
          <span className={`${SOURIS_SEULEMENT} flex-wrap items-center gap-2`}>
            <ReportsRapides
              aujourdhui={aujourdhui}
              titre={tache.titre}
              desactive={occupee}
              auSurvol
              onReporter={onReporterA}
              onAutreDate={onReporter}
            />
            {contact !== null && (
              <span className={VISIBLE_AU_SURVOL}>
                <Bouton
                  variante="secondaire"
                  icone="succes"
                  disabled={occupee}
                  onClick={onConsigner}
                  aria-label={`Fait : consigner « ${tache.titre} »`}
                >
                  <span className="text-sm">Fait</span>
                </Bouton>
              </span>
            )}
          </span>
        </div>
      </div>
    </LigneGlissable>
  )
}
