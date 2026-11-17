import Icone from '../../components/Icone'
import LienBouton from '../../components/LienBouton'
import { libelleOrigine } from '../acquereurs/pipeline-acquereur'
import { adresseBien } from '../biens/biens'
import { nomComplet } from '../contacts/contacts'
import BoutonAppel from './BoutonAppel'
import { enUneLigne, qualificationEnRetard, tempsEcoule } from './journee'
import type { Nouveaute } from './lecture-journee'

type Props = { nouveaute: Nouveaute; maintenant: Date }

/**
 * Une demande entrante pas encore qualifiée : qui, par quel canal, pour quel bien, et
 * depuis quand elle attend (en rouge au-delà d'une heure). Gestes : appeler, qualifier
 * (ouvre le projet d'achat).
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
    <li className="flex items-start gap-3 py-3">
      <Icone nom="nouveaute" className="mt-1 size-6 text-encre-douce" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="text-base font-semibold break-words text-encre">
            {contact === null ? 'Contact introuvable' : nomComplet(contact)}
          </span>
          <span
            className={`text-sm ${enRetard ? 'font-semibold text-danger' : 'text-encre-douce'}`}
          >
            Reçue {tempsEcoule(recueLe, maintenant)}
          </span>
        </div>
        <p className="text-sm break-words text-encre-douce">
          {[canal.join(' '), bien === null ? null : adresseBien(bien)]
            .filter((morceau) => morceau !== null && morceau !== '')
            .join(' · ') || 'Demande d’achat'}
        </p>
        {message !== '' && <p className="text-sm break-words text-encre">{message}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {contact !== null && <BoutonAppel contact={contact} />}
          <LienBouton icone="pipelines" vers={`/pipelines/acquereurs/${projet.id}`}>
            Qualifier
          </LienBouton>
        </div>
      </div>
    </li>
  )
}
