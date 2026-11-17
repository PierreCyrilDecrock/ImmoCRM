import { Link } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import Icone from '../../components/Icone'
import { nomComplet } from '../contacts/contacts'
import BoutonAppel from './BoutonAppel'
import CaseTache from './CaseTache'
import { enUneLigne, resumeDerniereActivite, retardRelance } from './journee'
import type { Relance } from './lecture-journee'

type Props = {
  relance: Relance
  aujourdhui: string
  occupee: boolean
  /** Ouvre la boucle de relance : résultat, compte rendu, prochaine action. */
  onConsigner: () => void
  onReporter: () => void
  onOuvrir: () => void
}

/**
 * Un contact à relancer : son nom, le retard, le motif et la dernière activité en une
 * ligne. « Appeler » compose le numéro et ouvre aussitôt la saisie du résultat, qui attend
 * le retour de l'appel ; « Consigner » l'ouvre sans appeler.
 */
export default function LigneRelance({
  relance,
  aujourdhui,
  occupee,
  onConsigner,
  onReporter,
  onOuvrir,
}: Props) {
  const { tache, contact, derniere } = relance
  const retard = retardRelance(tache.echeance, aujourdhui)
  const motif =
    tache.motif.trim() === '' ? tache.titre : `${tache.titre} — ${enUneLigne(tache.motif)}`

  return (
    <li className="flex items-start gap-1 py-2">
      <CaseTache titre={tache.titre} occupee={occupee} onCocher={onConsigner} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          {contact === null ? (
            <span className="text-base font-semibold break-words text-encre">{tache.titre}</span>
          ) : (
            <Link
              to={`/contacts/${contact.id}`}
              className="inline-flex min-h-11 min-w-0 items-center text-base font-semibold break-words text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent"
            >
              {nomComplet(contact)}
            </Link>
          )}
          <span
            className={`text-sm ${retard.enRetard ? 'font-semibold text-danger' : 'text-encre-douce'}`}
          >
            {retard.texte}
          </span>
        </div>
        <button
          type="button"
          onClick={onOuvrir}
          className="block w-full rounded-lg text-left text-sm break-words text-encre hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent"
        >
          {contact === null ? enUneLigne(tache.motif) || 'Relance sans contact' : motif}
        </button>
        {contact !== null && (
          <p className="mt-0.5 flex items-start gap-1 text-sm text-encre-douce">
            <Icone nom="journal" className="mt-0.5 size-4" />
            <span className="min-w-0 break-words">
              {resumeDerniereActivite(derniere, aujourdhui)}
            </span>
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {contact !== null && <BoutonAppel contact={contact} onAppel={onConsigner} />}
          <Bouton variante="secondaire" icone="journal" disabled={occupee} onClick={onConsigner}>
            <span className="text-sm">{contact === null ? 'Fait' : 'Consigner'}</span>
          </Bouton>
          <Bouton
            variante="discret"
            icone="horloge"
            disabled={occupee}
            onClick={onReporter}
            aria-label={`Reporter « ${tache.titre} »`}
          >
            <span className="text-sm">Reporter</span>
          </Bouton>
        </div>
      </div>
    </li>
  )
}
