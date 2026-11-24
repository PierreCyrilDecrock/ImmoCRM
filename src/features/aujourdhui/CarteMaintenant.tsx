import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import Icone from '../../components/Icone'
import LienBouton from '../../components/LienBouton'
import { libelleRole, nomComplet, type Contact } from '../contacts/contacts'
import { horaireTache, libelleCategorie, type TacheAffichee } from '../taches/taches'
import BoutonAppel from './BoutonAppel'
import CaseTache from './CaseTache'
import {
  adresseRendezVous,
  enUneLigne,
  lienItineraire,
  retardRelance,
  type Cartes,
} from './journee'
import type { Relance } from './lecture-journee'
import { ficheDuRendezVous, tempsRestant, type ChoixMaintenant } from './maintenant'

type Props = {
  choix: ChoixMaintenant<Relance>
  /** L'heure qu'il est, en minutes depuis minuit (Paris) : le temps restant en dépend. */
  minutes: number
  aujourdhui: string
  /** Les tâches du jour liées au même contact ou au même bien (`aPreparer`). */
  aPreparer: readonly TacheAffichee[]
  cartes: Cartes
  /** La tâche en cours d'enregistrement, s'il y en a une. */
  occupee: string | null
  onCocher: (affichee: TacheAffichee) => void
  onOuvrir: (affichee: TacheAffichee) => void
}

/** « Camille Fictif · Vendeur, Acquéreur ». */
function contactEtRole(contact: Contact): string {
  const roles = contact.roles.map(libelleRole).join(', ')
  return roles === '' ? nomComplet(contact) : `${nomComplet(contact)} · ${roles}`
}

/** La pastille du temps restant : claire quand le rendez-vous est en cours. */
function Pastille({ texte, genre }: { texte: string; genre: 'en_cours' | 'a_venir' | 'retard' }) {
  const couleurs = {
    en_cours: 'bg-sur-inverse text-inverse',
    a_venir: 'bg-inverse-creux text-sur-inverse',
    retard: 'bg-danger text-sur-plein',
  }
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${couleurs[genre]}`}
    >
      {texte}
    </span>
  )
}

/** Les deux gestes de la carte, de même largeur, côte à côte même sur téléphone. */
const CLASSES_GESTES = 'mt-4 flex gap-2 *:min-w-0 *:flex-1'

/**
 * Le grand titre de la carte, qui mène à la fiche (`vers`) avec un chevron ; sans fiche, il
 * ouvre la tâche elle-même (`onOuvrir`).
 */
function TitreVersFiche({
  texte,
  vers,
  fiche,
  onOuvrir,
}: {
  texte: string
  vers: string | null
  /** Dit aux lecteurs d'écran ce que le lien ouvre : « fiche du bien ». */
  fiche: string
  onOuvrir: () => void
}) {
  const classes =
    'group block w-full rounded-lg text-left text-2xl leading-tight font-bold tracking-tight break-words hover:bg-inverse-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
  // Le dernier mot reste collé au chevron : le chevron ne passe jamais seul à la ligne.
  const coupure = texte.trimEnd().lastIndexOf(' ')
  const debut = coupure === -1 ? '' : texte.slice(0, coupure + 1)
  const fin = coupure === -1 ? texte.trimEnd() : texte.trimEnd().slice(coupure + 1)
  const contenu = (
    <>
      <span className="group-hover:underline group-hover:underline-offset-4">{debut}</span>
      <span className="whitespace-nowrap">
        <span className="group-hover:underline group-hover:underline-offset-4">{fin}</span>
        <span className="sr-only">, {fiche}</span>
        <Icone
          nom="chevron"
          className="ml-1 inline-block size-6 align-[-0.2em] text-sur-inverse-doux"
        />
      </span>
    </>
  )
  return vers !== null ? (
    <Link to={vers} className={classes}>
      {contenu}
    </Link>
  ) : (
    <button type="button" onClick={onOuvrir} className={classes}>
      {contenu}
    </button>
  )
}

/**
 * La carte « Maintenant », en tête de l'écran Aujourd'hui, sur fond encre : le rendez-vous
 * en cours ou le prochain, avec son temps restant (remis à jour chaque minute par la page),
 * deux gestes de même largeur (Appeler en bleu, puis Itinéraire) et ce qu'il reste à
 * préparer ; le titre mène à la fiche du bien, sinon du contact. Après le dernier
 * rendez-vous, la première relance du jour (Appeler, Consigner ; le nom mène à la fiche).
 */
export default function CarteMaintenant(props: Props) {
  const { choix } = props
  return (
    <section
      aria-labelledby="carte-maintenant"
      className="zone-inverse min-w-0 rounded-2xl bg-inverse p-4 text-sur-inverse ring-1 ring-bord-inverse md:p-5"
    >
      {choix.genre === 'rendez_vous' ? (
        <RendezVous {...props} affichee={choix.affichee} enCours={choix.enCours} />
      ) : (
        <ProchaineRelance {...props} relance={choix.relance} />
      )}
    </section>
  )
}

function Entete({ titre, pastille }: { titre: string; pastille: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2
        id="carte-maintenant"
        className="text-sm font-semibold tracking-wide text-sur-inverse-doux uppercase"
      >
        {titre}
      </h2>
      {pastille}
    </div>
  )
}

function RendezVous({
  affichee,
  enCours,
  minutes,
  aPreparer,
  cartes,
  occupee,
  onCocher,
  onOuvrir,
}: Props & { affichee: TacheAffichee; enCours: boolean }) {
  const { tache, contact, bien } = affichee
  const adresse = adresseRendezVous(tache, bien, contact)
  const fiche = ficheDuRendezVous(affichee)

  return (
    <>
      <Entete
        titre={enCours ? 'Rendez-vous en cours' : 'Prochain rendez-vous'}
        pastille={
          <Pastille texte={tempsRestant(tache, minutes)} genre={enCours ? 'en_cours' : 'a_venir'} />
        }
      />

      <p className="mt-3 text-base font-semibold text-sur-inverse-doux tabular-nums">
        {horaireTache(tache)} · {libelleCategorie(tache.categorie)}
      </p>
      <div className="mt-0.5">
        <TitreVersFiche
          texte={tache.titre}
          vers={fiche}
          fiche={
            bien !== null ? 'fiche du bien' : contact !== null ? 'fiche du contact' : 'le modifier'
          }
          onOuvrir={() => onOuvrir(affichee)}
        />
      </div>
      {contact !== null && (
        <p className="mt-2 flex items-start gap-1.5 text-base break-words">
          <Icone nom="contacts" className="mt-0.5 size-5 text-sur-inverse-doux" />
          <span className="min-w-0">{contactEtRole(contact)}</span>
        </p>
      )}
      {adresse !== null && (
        <p className="mt-1 flex items-start gap-1.5 text-base break-words text-sur-inverse-doux">
          <Icone nom="lieu" className="mt-0.5 size-5" />
          <span className="min-w-0">{adresse}</span>
        </p>
      )}

      <div className={CLASSES_GESTES}>
        {contact !== null && <BoutonAppel contact={contact} surInverse />}
        {adresse !== null && (
          <LienBouton
            icone="itineraire"
            variante="inverse"
            href={lienItineraire(adresse, cartes)}
            nouvelOnglet
            aria-label={`Itinéraire jusqu'à ${adresse}`}
          >
            Itinéraire
          </LienBouton>
        )}
      </div>

      {aPreparer.length > 0 && (
        <div className="mt-4 border-t border-inverse-creux pt-3">
          <h3 className="text-sm font-semibold text-sur-inverse-doux">À préparer</h3>
          <ul className="mt-1 flex flex-col">
            {aPreparer.map((preparer) => (
              <li key={preparer.id} className="flex items-center gap-1">
                <CaseTache
                  titre={preparer.tache.titre}
                  occupee={occupee === preparer.id}
                  onCocher={() => onCocher(preparer)}
                  inverse
                />
                <button
                  type="button"
                  onClick={() => onOuvrir(preparer)}
                  className="min-h-11 min-w-0 flex-1 rounded-lg px-1 text-left text-base break-words hover:bg-inverse-creux"
                >
                  {preparer.tache.titre}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

function ProchaineRelance({
  relance,
  aujourdhui,
  occupee,
  onCocher,
  onOuvrir,
}: Props & { relance: Relance }) {
  const { tache, contact } = relance
  const retard = retardRelance(tache.echeance, aujourdhui)
  const motif = enUneLigne(tache.motif)

  return (
    <>
      <Entete
        titre="Prochaine relance"
        pastille={<Pastille texte={retard.texte} genre={retard.enRetard ? 'retard' : 'a_venir'} />}
      />

      <div className="mt-3">
        <TitreVersFiche
          texte={contact === null ? tache.titre : nomComplet(contact)}
          vers={contact === null ? null : `/contacts/${contact.id}`}
          fiche={contact === null ? 'la modifier' : 'fiche du contact'}
          onOuvrir={() => onOuvrir(relance)}
        />
      </div>
      {contact !== null && contact.roles.length > 0 && (
        <p className="mt-0.5 text-base text-sur-inverse-doux">
          {contact.roles.map(libelleRole).join(', ')}
        </p>
      )}
      <p className="mt-2 text-base break-words">
        {contact === null ? motif || 'Relance sans contact' : tache.titre}
        {contact !== null && motif !== '' && (
          <span className="text-sur-inverse-doux"> — {motif}</span>
        )}
      </p>

      <div className={CLASSES_GESTES}>
        {contact !== null && (
          <BoutonAppel contact={contact} onAppel={() => onCocher(relance)} surInverse />
        )}
        <Bouton
          variante="inverse"
          icone="journal"
          disabled={occupee === relance.id}
          onClick={() => onCocher(relance)}
        >
          <span className="text-sm">{contact === null ? 'Fait' : 'Consigner'}</span>
        </Bouton>
      </div>
    </>
  )
}
