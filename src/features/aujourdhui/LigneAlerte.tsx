import { Link } from 'react-router-dom'
import Icone from '../../components/Icone'
import LienBouton from '../../components/LienBouton'
import { libelleEtapeAcquereur } from '../acquereurs/pipeline-acquereur'
import { adresseBien } from '../biens/biens'
import { nomComplet, type Contact } from '../contacts/contacts'
import InitialesRole from '../contacts/InitialesRole'
import { detailSansActionAccueil } from '../contacts/jamais-contactes'
import { rolesDuContact, teinteRole } from '../contacts/ligne-contact'
import { libelleEtape } from '../projets/pipeline-vendeur'
import { ancienneteExport } from '../sauvegarde/rappel-export'
import { initialesDe } from '../saisie/recents'
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
 *
 * Un contact sans prochaine action tient en une ligne de 64 px (étape F.2, proposition 5) :
 * les initiales colorées selon le rôle, le nom, le rôle et « jamais contacté » ou « il y a
 * 3 sem. » ; toucher la ligne ouvre la fiche ; un seul geste, le rond « Planifier »
 * (calendrier), qui ouvre la création d'une action pour ce contact.
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
  const nom = nomComplet(contact)
  const role = rolesDuContact(contact)
  return (
    <li className="flex items-center gap-2 pr-1">
      <Link
        to={`/contacts/${contact.id}`}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-lg py-2 pr-1 pl-2 text-left hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent"
      >
        <InitialesRole initiales={initialesDe(nom)} teinte={teinteRole(contact)} role={role} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold text-encre">{nom}</span>
          <span className="sr-only">, </span>
          <span className="block truncate text-sm text-encre-douce">
            {detailSansActionAccueil(contact, aujourdhui, alerte.jamaisContacte)}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => onPlanifier(contact)}
        aria-label={`Planifier une action avec ${nom}`}
        title="Planifier"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-encre shadow-xs ring-1 ring-bord-fort/40 ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Icone nom="calendrier" className="size-5" />
      </button>
    </li>
  )
}
