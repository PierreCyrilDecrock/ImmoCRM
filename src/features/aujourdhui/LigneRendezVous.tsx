import Icone from '../../components/Icone'
import LienBouton from '../../components/LienBouton'
import { adresseBien } from '../biens/biens'
import { nomComplet } from '../contacts/contacts'
import { horaireTache, libelleCategorie, type TacheAffichee } from '../taches/taches'
import BoutonAppel from './BoutonAppel'
import CaseTache from './CaseTache'
import { adresseRendezVous, lienItineraire, type Cartes } from './journee'

type Props = {
  affichee: TacheAffichee
  cartes: Cartes
  occupee: boolean
  onCocher: () => void
  onOuvrir: () => void
  /** Rendez-vous fini (au-dessus du trait « maintenant ») : il s'estompe légèrement. */
  passe?: boolean
}

/**
 * Un rendez-vous de l'agenda du jour : l'heure, ce qu'il faut faire, l'adresse, puis les
 * gestes : appeler, lancer l'itinéraire, ouvrir la fiche. Le toucher sur le titre ouvre le
 * rendez-vous pour le modifier ou le reporter ; la case le clôt (avec le compte rendu si un
 * contact y est lié).
 */
export default function LigneRendezVous({
  affichee,
  cartes,
  occupee,
  onCocher,
  onOuvrir,
  passe = false,
}: Props) {
  const { tache, contact, bien } = affichee
  const adresse = adresseRendezVous(tache, bien, contact)
  const liens = [
    contact === null ? null : nomComplet(contact),
    bien === null ? null : adresseBien(bien),
  ]
    .filter((lien) => lien !== null)
    .filter((lien) => lien !== adresse)

  return (
    <li className="flex items-start gap-1 py-2">
      <CaseTache titre={tache.titre} occupee={occupee} onCocher={onCocher} />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onOuvrir}
          className="block w-full rounded-lg py-1 text-left hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent"
        >
          <span className="block text-sm text-encre-douce">
            <span className={`font-bold ${passe ? 'text-encre-douce' : 'text-encre'}`}>
              {horaireTache(tache)}
            </span>
            {' · '}
            {libelleCategorie(tache.categorie)}
          </span>
          <span
            className={`block text-base font-medium break-words ${passe ? 'text-encre-douce' : 'text-encre'}`}
          >
            {passe && <span className="sr-only">Terminé : </span>}
            {tache.titre}
          </span>
          {liens.length > 0 && (
            <span className="block truncate text-sm text-encre-douce">{liens.join(' · ')}</span>
          )}
        </button>
        {adresse !== null && (
          <p className="flex items-start gap-1 text-sm break-words text-encre-douce">
            <Icone nom="lieu" className="mt-0.5 size-4" />
            {adresse}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {contact !== null && <BoutonAppel contact={contact} />}
          {adresse !== null && (
            <LienBouton
              icone="itineraire"
              href={lienItineraire(adresse, cartes)}
              nouvelOnglet
              aria-label={`Itinéraire jusqu'à ${adresse}`}
            >
              Itinéraire
            </LienBouton>
          )}
          {contact !== null && (
            <LienBouton icone="contacts" variante="discret" vers={`/contacts/${contact.id}`}>
              Contact
            </LienBouton>
          )}
          {bien !== null && (
            <LienBouton icone="biens" variante="discret" vers={`/biens/${bien.id}`}>
              Bien
            </LienBouton>
          )}
        </div>
      </div>
    </li>
  )
}
