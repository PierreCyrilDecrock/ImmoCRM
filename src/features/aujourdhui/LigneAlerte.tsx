import Bouton from '../../components/Bouton'
import Icone from '../../components/Icone'
import LienBouton from '../../components/LienBouton'
import { libelleEtapeAcquereur } from '../acquereurs/pipeline-acquereur'
import { adresseBien } from '../biens/biens'
import { libelleTemperature, nomComplet, type Contact } from '../contacts/contacts'
import { libelleEtape } from '../projets/pipeline-vendeur'
import { ancienneteExport } from '../sauvegarde/rappel-export'
import { formaterDate } from '../../lib/dates'
import BoutonAppel from './BoutonAppel'
import { joursDepuis } from './journee'
import type { Alerte } from './lecture-journee'

type Props = {
  alerte: Alerte
  aujourdhui: string
  /** Ouvre la création d'une prochaine action pour ce contact. */
  onPlanifier: (contact: Contact) => void
}

/**
 * Une alerte de l'écran Aujourd'hui, avec le geste qui la traite. Chaque genre d'alerte a
 * son affichage : la version 2 ajoutera ici les échéances de mandat et de transaction.
 */
export default function LigneAlerte({ alerte, aujourdhui, onPlanifier }: Props) {
  if (alerte.genre === 'export_a_faire') {
    return (
      <li className="flex items-start gap-3 py-3">
        <Icone nom="document" className="mt-1 size-6 text-encre-douce" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold break-words text-encre">Exportez vos données</p>
          <p className="text-sm font-semibold text-alerte">
            {alerte.jours === null
              ? "Aucun export n'a encore été fait."
              : `Dernier export ${ancienneteExport(alerte.jours)}.`}
          </p>
          <p className="text-sm text-encre-douce">
            Un fichier complet, rangé hors de cet appareil, protège votre fichier clients.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <LienBouton icone="document" variante="secondaire" vers="/plus/reglages">
              Exporter
            </LienBouton>
          </div>
        </div>
      </li>
    )
  }

  if (alerte.genre === 'projet_sans_activite') {
    const { projet } = alerte
    const vendeur = projet.genre === 'vendeur'
    const etape = vendeur ? libelleEtape(projet.etape) : libelleEtapeAcquereur(projet.etape)
    const jours = joursDepuis(projet.calmeDepuis, aujourdhui)
    const nom = projet.contact === null ? 'Contact introuvable' : nomComplet(projet.contact)
    return (
      <li className="flex items-start gap-3 py-3">
        <Icone nom="pipelines" className="mt-1 size-6 text-encre-douce" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold break-words text-encre">
            {vendeur ? 'Vente' : 'Achat'} · {nom}
          </p>
          <p className="text-sm break-words text-encre-douce">
            {[etape, projet.bien === null ? null : adresseBien(projet.bien)]
              .filter((morceau) => morceau !== null && morceau !== '')
              .join(' · ')}
          </p>
          <p className="text-sm font-semibold text-alerte">Sans activité depuis {jours} jours</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {projet.contact !== null && <BoutonAppel contact={projet.contact} />}
            <LienBouton
              icone="pipelines"
              vers={`/pipelines/${vendeur ? 'vendeurs' : 'acquereurs'}/${projet.projetId}`}
            >
              Ouvrir le projet
            </LienBouton>
          </div>
        </div>
      </li>
    )
  }

  const { contact } = alerte
  const temperature = libelleTemperature(contact.temperature)
  return (
    <li className="flex items-start gap-3 py-3">
      <Icone nom="contacts" className="mt-1 size-6 text-encre-douce" />
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold break-words text-encre">{nomComplet(contact)}</p>
        <p className="text-sm text-encre-douce">
          {[`Fiche créée le ${formaterDate(contact.created_at)}`, temperature]
            .filter((morceau) => morceau !== null)
            .join(' · ')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Bouton variante="secondaire" icone="ajouter" onClick={() => onPlanifier(contact)}>
            <span className="text-sm">Planifier</span>
          </Bouton>
          <LienBouton icone="contacts" variante="discret" vers={`/contacts/${contact.id}`}>
            Fiche
          </LienBouton>
        </div>
      </div>
    </li>
  )
}
