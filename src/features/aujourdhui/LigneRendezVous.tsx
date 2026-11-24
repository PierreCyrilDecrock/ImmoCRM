import { Link } from 'react-router-dom'
import LienBouton from '../../components/LienBouton'
import { formaterHeure } from '../../lib/dates'
import { nomComplet } from '../contacts/contacts'
import type { TacheAffichee } from '../taches/taches'
import CaseTache from '../taches/CaseTache'
import { adresseRendezVous, lienItineraire, type Cartes } from './journee'
import { detailRendezVous, ficheDuRendezVous } from './maintenant'

type Props = {
  affichee: TacheAffichee
  cartes: Cartes
  occupee: boolean
  onCocher: () => void
  /** Ouvre le rendez-vous lui-même : seulement s'il n'est lié ni à un bien ni à un contact. */
  onOuvrir: () => void
  /** Rendez-vous fini (au-dessus du trait « maintenant ») : il s'estompe légèrement. */
  passe?: boolean
  /** Déjà montré par la carte « Maintenant » : la marque « Ci-dessus », sans geste. */
  ciDessus?: boolean
}

/** Largeur de la colonne des heures : la même que celle du trait « maintenant ». */
const COLONNE_HEURE = 'w-14 shrink-0'

const CLASSES_ZONE =
  'flex min-h-14 min-w-0 flex-1 flex-col justify-center rounded-lg py-1.5 pr-1 text-left hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent'

/**
 * Un rendez-vous de l'agenda du jour, en frise : l'heure de début dans une colonne à gauche
 * (chiffres alignés), la case ronde qui le clôt, le titre, puis la durée et le lieu (ou le
 * contact). Toucher la ligne ouvre la fiche du bien, sinon celle du contact. Un seul geste,
 * Itinéraire (dessin seul) ; Appeler reste dans la carte « Maintenant » et dans la fiche.
 * Le rendez-vous déjà montré par la carte porte « Ci-dessus » à la place.
 */
export default function LigneRendezVous({
  affichee,
  cartes,
  occupee,
  onCocher,
  onOuvrir,
  passe = false,
  ciDessus = false,
}: Props) {
  const { tache, contact, bien } = affichee
  const adresse = adresseRendezVous(tache, bien, contact)
  const fiche = ficheDuRendezVous(affichee)
  const heure = formaterHeure(tache.heure)
  const detail = detailRendezVous(
    tache.duree,
    adresse,
    contact === null ? null : nomComplet(contact),
  )
  const couleur = passe ? 'text-encre-douce' : 'text-encre'

  const contenu = (
    <>
      <span className="sr-only">
        {heure}, {passe ? 'terminé : ' : ''}
      </span>
      <span className={`block truncate text-base font-medium ${couleur}`}>{tache.titre}</span>
      {detail !== '' && <span className="block truncate text-sm text-encre-douce">{detail}</span>}
    </>
  )

  return (
    <li className="flex items-center gap-1">
      <span
        aria-hidden="true"
        className={`${COLONNE_HEURE} text-sm font-semibold tabular-nums ${couleur}`}
      >
        {heure}
      </span>
      <CaseTache titre={tache.titre} occupee={occupee} onCocher={onCocher} />
      {fiche !== null ? (
        <Link to={fiche} className={CLASSES_ZONE}>
          {contenu}
        </Link>
      ) : (
        <button type="button" onClick={onOuvrir} className={CLASSES_ZONE}>
          {contenu}
        </button>
      )}
      {ciDessus ? (
        <span className="shrink-0 rounded-full bg-creux px-2.5 py-0.5 text-xs font-semibold text-encre-douce">
          Ci-dessus
          <span className="sr-only"> : dans la carte « Maintenant »</span>
        </span>
      ) : (
        adresse !== null && (
          <LienBouton
            icone="itineraire"
            href={lienItineraire(adresse, cartes)}
            nouvelOnglet
            dessinSeul
            aria-label={`Itinéraire jusqu'à ${adresse}`}
          >
            Itinéraire
          </LienBouton>
        )
      )}
    </li>
  )
}
