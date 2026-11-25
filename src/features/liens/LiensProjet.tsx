import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Carte from '../../components/Carte'
import Information from '../../components/Information'
import LienBouton from '../../components/LienBouton'
import BoutonAppel from '../aujourdhui/BoutonAppel'
import { lienItineraire, type Cartes } from '../aujourdhui/journee'
import { adresseBien, type Bien } from '../biens/biens'
import { nomComplet, type Contact } from '../contacts/contacts'
import { CLASSES_LIEN } from '../contacts/coordonnees'

type Props = {
  /** « Vendeur et bien », « Acquéreur et demande ». */
  titre: string
  /** Le contact principal du projet : son rôle (« Vendeur »), sa fiche, une ligne de plus. */
  contact: { role: string; fiche: Contact | null; detail?: ReactNode }
  /** Le bien du projet (vente) ou le bien d'origine de la demande (achat), s'il y en a un. */
  bien?: { role: string; fiche: Bien }
  cartes: Cartes
  /** Colonne étroite (profil sur ordinateur) : le nom de chaque ligne au-dessus. */
  empilee?: boolean
  /** Autres lignes (co-acquéreur, origine de la demande), dans la même liste. */
  children?: ReactNode
  /** Sous la liste (la recherche d'un co-acquéreur). */
  apres?: ReactNode
}

/**
 * Le contact et le bien liés à un projet (étape D.7), dans le profil de sa fiche : le nom
 * ouvre la fiche du contact, « Appeler » d'un toucher (accord pour être appelé respecté) ;
 * l'adresse ouvre la fiche du bien, « Itinéraire » d'un toucher.
 */
export default function LiensProjet({
  titre,
  contact,
  bien,
  cartes,
  empilee = false,
  children,
  apres,
}: Props) {
  return (
    <Carte titre={titre}>
      <dl className="divide-y divide-bord">
        <Information nom={contact.role} empilee={empilee}>
          {contact.fiche === null ? (
            'Contact introuvable'
          ) : (
            <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="min-w-0">
                <Link
                  to={`/contacts/${contact.fiche.id}`}
                  className={`${CLASSES_LIEN} break-words`}
                >
                  {nomComplet(contact.fiche)}
                </Link>
                {contact.detail !== undefined && (
                  <span className="block text-sm text-encre-douce">{contact.detail}</span>
                )}
              </span>
              <BoutonAppel contact={contact.fiche} />
            </span>
          )}
        </Information>
        {bien !== undefined && (
          <Information nom={bien.role} empilee={empilee}>
            <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <Link
                to={`/biens/${bien.fiche.id}`}
                className={`${CLASSES_LIEN} min-w-0 break-words`}
              >
                {adresseBien(bien.fiche)}
              </Link>
              <LienBouton
                icone="itineraire"
                variante="secondaire"
                nouvelOnglet
                href={lienItineraire(adresseBien(bien.fiche), cartes)}
                aria-label={`Itinéraire jusqu’à ${adresseBien(bien.fiche)}`}
              >
                Itinéraire
              </LienBouton>
            </span>
          </Information>
        )}
        {children}
      </dl>
      {apres}
    </Carte>
  )
}
