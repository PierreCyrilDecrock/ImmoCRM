import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import LienBouton from '../../components/LienBouton'
import LigneGlissable from '../../components/LigneGlissable'
import { VISIBLE_AU_SURVOL } from '../../components/survol'
import { deNom, nomComplet } from '../contacts/contacts'
import { initialesDe } from '../saisie/recents'
import ReportsRapides from '../taches/ReportsRapides'
import BoutonAppel from './BoutonAppel'
import InitialesRole from '../contacts/InitialesRole'
import type { Relance } from './lecture-journee'
import { rolesDuContact, teinteRole } from '../contacts/ligne-contact'
import PastilleRetard from '../taches/PastilleRetard'
import { pastilleRetard } from '../taches/retards'
import { dernierEchange, motifRelance } from './ordre-journee'

type Props = {
  relance: Relance
  aujourdhui: string
  occupee: boolean
  /**
   * Appareil à souris (ordinateur) : la ligne mène à la fiche, et les reports en un geste
   * avec « Fait » apparaissent au survol ou au clavier. Sinon, toucher la ligne la déplie.
   */
  survol: boolean
  /** La ligne est dépliée (écran tactile ; une seule à la fois, choisie par la page). */
  depliee: boolean
  /** Toucher la ligne : la déplie, ou la replie. */
  onBasculer: () => void
  /** Ouvre la boucle de relance : résultat, compte rendu, prochaine action. */
  onConsigner: () => void
  /** Ouvre la fenêtre de report (délais et calendrier). */
  onReporter: () => void
  /** Reporte aussitôt à cette date, avec « Annuler » dans la confirmation. */
  onReporterA: (echeance: string) => void
  /** Ouvre la relance elle-même (relance sans contact : il n'y a pas de fiche). */
  onOuvrir: () => void
}

const CLASSES_ZONE =
  'flex min-h-16 w-full min-w-0 items-center gap-3 rounded-lg py-2 pr-1 pl-2 text-left focus-visible:outline-2 focus-visible:outline-accent'

/**
 * Un contact à rappeler, en une ligne de 64 px : les initiales colorées selon le rôle, le nom
 * en gras et le motif (titre de la tâche) dessous, le retard en pastille courte (« 5 j ») et
 * un seul geste, Appeler, qui compose le numéro et ouvre aussitôt la saisie du résultat.
 *
 * Sur écran tactile, toucher la ligne la déplie (l'équivalent visible du glisser) : le
 * dernier échange, puis Consigner, Fait, la fiche et les reports en un geste ; Échap la
 * replie. Glisser la ligne découvre toujours Reporter et Fait. Sur ordinateur, la ligne
 * garde la même forme, mène à la fiche, montre le dernier échange à droite du motif, et les
 * reports avec « Fait » apparaissent au survol ou au clavier.
 */
export default function LigneRelance({
  relance,
  aujourdhui,
  occupee,
  survol,
  depliee,
  onBasculer,
  onConsigner,
  onReporter,
  onReporterA,
  onOuvrir,
}: Props) {
  const { tache, contact, derniere } = relance
  const bascule = useRef<HTMLButtonElement>(null)
  const retard = pastilleRetard(tache.echeance, aujourdhui)
  const nom = contact === null ? 'Sans contact' : nomComplet(contact)
  const role = contact === null ? null : rolesDuContact(contact)
  // Une lecture en échec (`undefined`) ne dit rien : « Jamais contacté » seulement si c'est vrai.
  const echange =
    contact === null || derniere === undefined ? null : dernierEchange(derniere, aujourdhui)
  const peutAppeler = contact !== null && contact.telephones[0] !== undefined
  const idGestes = `gestes-relance-${relance.id}`
  const ouverte = !survol && depliee

  function surTouche(evenement: KeyboardEvent<HTMLDivElement>) {
    if (evenement.key !== 'Escape' || !ouverte) return
    evenement.stopPropagation()
    onBasculer()
    bascule.current?.focus()
  }

  const texte: ReactNode = (
    <>
      <InitialesRole
        initiales={contact === null ? '' : initialesDe(nom)}
        teinte={teinteRole(contact)}
        role={role ?? undefined}
      />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-base font-semibold break-words text-encre">{nom}</span>
        <span className="flex min-w-0 items-baseline gap-1.5 text-sm text-encre-douce">
          <span className="sr-only">{role === null ? ', ' : `, ${role}, `}</span>
          <span
            className={`min-w-0 ${survol && echange !== null ? 'truncate md:max-w-[60%] md:shrink-0' : 'line-clamp-2 break-words'}`}
          >
            {contact === null ? tache.titre : motifRelance(tache, nom)}
          </span>
          {survol && echange !== null && (
            // À la souris, la place ne manque pas : le dernier échange suit le motif.
            <span className="hidden min-w-0 items-baseline gap-1.5 md:flex">
              <span aria-hidden="true">·</span>
              <span className="min-w-0 truncate">{echange}</span>
            </span>
          )}
        </span>
        {retard !== null && <span className="sr-only">, {retard.annonce}</span>}
      </span>
    </>
  )

  return (
    <LigneGlissable
      className="group/ligne"
      desactivee={occupee}
      actions={[
        { libelle: 'Reporter', icone: 'horloge', genre: 'alerte', onAction: onReporter },
        { libelle: 'Fait', icone: 'succes', genre: 'succes', onAction: onConsigner },
      ]}
    >
      <div onKeyDown={surTouche}>
        <div
          className={`flex items-center gap-2 pr-3 pl-2 ${survol ? 'group-focus-within/ligne:bg-creux group-hover/ligne:bg-creux' : ''}`}
        >
          <div className="relative flex min-w-0 flex-1">
            {!survol ? (
              <button
                ref={bascule}
                type="button"
                aria-expanded={ouverte}
                aria-controls={idGestes}
                onClick={onBasculer}
                className={`${CLASSES_ZONE} ${ouverte ? '' : 'active:bg-creux'}`}
              >
                {texte}
              </button>
            ) : contact !== null ? (
              <Link to={`/contacts/${contact.id}`} className={CLASSES_ZONE}>
                {texte}
              </Link>
            ) : (
              <button type="button" onClick={onOuvrir} className={CLASSES_ZONE}>
                {texte}
              </button>
            )}

            {/* Ordinateur : les reports et « Fait » viennent par-dessus la fin du texte. */}
            {survol && (
              <div className={`absolute inset-y-0 right-0 flex ${VISIBLE_AU_SURVOL}`}>
                <span aria-hidden="true" className="w-6 bg-linear-to-r from-transparent to-creux" />
                <div className="flex items-center gap-1.5 bg-creux pl-1">
                  <ReportsRapides
                    aujourdhui={aujourdhui}
                    titre={tache.titre}
                    desactive={occupee}
                    onReporter={onReporterA}
                    onAutreDate={onReporter}
                  />
                  <Bouton
                    variante="secondaire"
                    icone="succes"
                    disabled={occupee}
                    onClick={onConsigner}
                    aria-label={`Fait : consigner « ${tache.titre} »`}
                  >
                    <span className="text-sm">Fait</span>
                  </Bouton>
                </div>
              </div>
            )}
          </div>

          {/* L'annonce est déjà lue avec le texte de la ligne. */}
          {retard !== null && <PastilleRetard texte={retard.texte} />}
          {peutAppeler ? (
            <BoutonAppel contact={contact} rond onAppel={onConsigner} />
          ) : (
            // La place d'Appeler est gardée : les pastilles de retard restent alignées.
            <span aria-hidden="true" className="size-11 shrink-0" />
          )}
        </div>

        {ouverte && (
          <div id={idGestes} className="flex flex-col gap-2 px-4 pb-3">
            {(role !== null || echange !== null) && (
              <p className="pl-[3.25rem] text-sm text-encre-douce">
                {[role, echange].filter((morceau) => morceau !== null).join(' · ')}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {contact !== null && (
                <Bouton
                  variante="secondaire"
                  icone="journal"
                  disabled={occupee}
                  onClick={onConsigner}
                >
                  <span className="text-sm">Consigner</span>
                </Bouton>
              )}
              <Bouton
                variante="secondaire"
                icone="succes"
                disabled={occupee}
                onClick={onConsigner}
                aria-label={`Fait : ${contact === null ? 'clore' : 'consigner'} « ${tache.titre} »`}
              >
                <span className="text-sm">Fait</span>
              </Bouton>
              {contact !== null ? (
                <LienBouton
                  icone="contacts"
                  variante="discret"
                  vers={`/contacts/${contact.id}`}
                  aria-label={`Ouvrir la fiche ${deNom(nom)}`}
                >
                  Fiche
                </LienBouton>
              ) : (
                <Bouton variante="discret" icone="modifier" disabled={occupee} onClick={onOuvrir}>
                  <span className="text-sm">Ouvrir</span>
                </Bouton>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <p aria-hidden="true" className="text-xs font-semibold text-encre-douce">
                Reporter
              </p>
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
    </LigneGlissable>
  )
}
