import { Link } from 'react-router-dom'
import Icone from '../../components/Icone'
import { libelleOrigine } from '../acquereurs/pipeline-acquereur'
import { adresseBien } from '../biens/biens'
import { nomComplet } from '../contacts/contacts'
import BoutonAppel from './BoutonAppel'
import { enUneLigne, qualificationEnRetard, tempsEcoule } from './journee'
import type { Nouveaute } from './lecture-journee'

type Props = { nouveaute: Nouveaute; maintenant: Date }

/**
 * Une demande entrante pas encore qualifiée : qui, par quel canal, pour quel bien, et
 * depuis quand elle attend (en rouge au-delà d'une heure). Règle 1 (recette D.8) : un seul
 * geste visible, le rond Appeler ; toucher la ligne ouvre le projet d'achat pour le qualifier.
 */
export default function LigneNouveaute({ nouveaute, maintenant }: Props) {
  const { projet, contact, bien, recueLe } = nouveaute
  const origine = libelleOrigine(projet.origine)
  const canal = [origine, projet.portail.trim()].filter(
    (morceau) => morceau !== null && morceau !== '',
  )
  const enRetard = qualificationEnRetard(recueLe, maintenant)
  const message = enUneLigne(projet.notes, 80)

  return (
    <li className="flex items-center gap-2 pr-1">
      <Link
        to={`/pipelines/acquereurs/${projet.id}`}
        className="flex min-h-16 min-w-0 flex-1 items-start gap-3 rounded-lg py-2 pr-1 pl-2 text-left hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Icone nom="nouveaute" className="mt-0.5 size-6 shrink-0 text-encre-douce" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-2">
            <span className="text-base font-semibold break-words text-encre">
              {contact === null ? 'Contact introuvable' : nomComplet(contact)}
            </span>
            <span
              className={`text-sm ${enRetard ? 'font-semibold text-danger' : 'text-encre-douce'}`}
            >
              Reçue {tempsEcoule(recueLe, maintenant)}
            </span>
          </span>
          <span className="block text-sm break-words text-encre-douce">
            {[canal.join(' '), bien === null ? null : adresseBien(bien)]
              .filter((morceau) => morceau !== null && morceau !== '')
              .join(' · ') || 'Demande d’achat'}
          </span>
          {message !== '' && (
            <span className="block text-sm break-words text-encre">{message}</span>
          )}
          <span className="sr-only">, ouvrir pour qualifier la demande</span>
        </span>
      </Link>
      {contact !== null && <BoutonAppel contact={contact} rond />}
    </li>
  )
}
