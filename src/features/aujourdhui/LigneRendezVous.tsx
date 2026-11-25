import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import LienBouton from '../../components/LienBouton'
import { VISIBLE_AU_SURVOL } from '../../components/survol'
import { formaterHeure } from '../../lib/dates'
import { deNom, nomComplet } from '../contacts/contacts'
import type { TacheAffichee } from '../taches/taches'
import CaseTache from '../taches/CaseTache'
import { adresseRendezVous, lienItineraire, type Cartes } from './journee'
import { adresseCourte, detailRendezVous, ficheDuRendezVous } from './maintenant'

type Props = {
  affichee: TacheAffichee
  cartes: Cartes
  occupee: boolean
  onCocher: () => void
  /** Ouvre le rendez-vous lui-même : seulement s'il n'est lié ni à un bien ni à un contact. */
  onOuvrir: () => void
  /**
   * Appareil à souris (ordinateur) : la ligne mène à la fiche, et Itinéraire apparaît au
   * survol ou au clavier. Sinon, toucher la ligne la déplie.
   */
  survol: boolean
  /** La ligne est dépliée (écran tactile ; une seule à la fois, choisie par la page). */
  depliee: boolean
  /** Toucher la ligne : la déplie, ou la replie. */
  onBasculer: () => void
  /** Rendez-vous fini (au-dessus du trait « maintenant ») : il s'estompe légèrement. */
  passe?: boolean
  /** Déjà montré par la carte « Maintenant » : il s'estompe de même, sans autre marque. */
  ciDessus?: boolean
}

/** Largeur de la colonne des heures : la même que celle du trait « maintenant ». */
const COLONNE_HEURE = 'w-14 shrink-0'

const CLASSES_ZONE =
  'flex min-h-14 w-full min-w-0 flex-1 flex-col justify-center rounded-lg py-1.5 pr-1 text-left focus-visible:outline-2 focus-visible:outline-accent'

/**
 * Un rendez-vous de l'agenda du jour, en frise : l'heure de début dans une colonne à gauche
 * (chiffres alignés), la case ronde qui le clôt, le titre, puis la durée et la rue (ou le
 * contact). Aucun bouton sur la ligne (étape F.2, proposition 4) : le titre a toute la
 * largeur. Sur écran tactile, toucher la ligne la déplie : Itinéraire (adresse complète) et
 * l'ouverture de la fiche du bien, sinon du contact, sinon du rendez-vous ; Échap la replie.
 * Sur ordinateur, la ligne mène à la fiche et Itinéraire apparaît au survol ou au clavier.
 * Le rendez-vous déjà montré par la carte « Maintenant » est simplement estompé.
 */
export default function LigneRendezVous({
  affichee,
  cartes,
  occupee,
  onCocher,
  onOuvrir,
  survol,
  depliee,
  onBasculer,
  passe = false,
  ciDessus = false,
}: Props) {
  const { tache, contact, bien } = affichee
  const bascule = useRef<HTMLButtonElement>(null)
  const adresse = adresseRendezVous(tache, bien, contact)
  const fiche = ficheDuRendezVous(affichee)
  const heure = formaterHeure(tache.heure)
  const detail = detailRendezVous(
    tache.duree,
    adresseCourte(tache, bien, contact),
    contact === null ? null : nomComplet(contact),
  )
  const estompe = passe || ciDessus
  const couleur = estompe ? 'text-encre-douce' : 'text-encre'
  const ouverte = !survol && depliee
  const idGestes = `gestes-rendez-vous-${affichee.id}`

  function surTouche(evenement: KeyboardEvent<HTMLLIElement>) {
    if (evenement.key !== 'Escape' || !ouverte) return
    evenement.stopPropagation()
    onBasculer()
    bascule.current?.focus()
  }

  const contenu: ReactNode = (
    <>
      <span className="sr-only">
        {heure}, {passe ? 'terminé : ' : ''}
      </span>
      <span className={`line-clamp-3 text-base font-medium break-words ${couleur}`}>
        {tache.titre}
      </span>
      {detail !== '' && <span className="block truncate text-sm text-encre-douce">{detail}</span>}
      {ciDessus && <span className="sr-only"> (dans la carte ci-dessus)</span>}
    </>
  )

  const itineraire = (dessinSeul: boolean) =>
    adresse !== null && (
      <LienBouton
        icone="itineraire"
        variante="secondaire"
        href={lienItineraire(adresse, cartes)}
        nouvelOnglet
        dessinSeul={dessinSeul}
        aria-label={`Itinéraire jusqu'à ${adresse}`}
      >
        Itinéraire
      </LienBouton>
    )

  return (
    <li className="group/ligne" onKeyDown={surTouche}>
      <div
        className={`flex items-center ${survol ? 'rounded-lg group-focus-within/ligne:bg-creux group-hover/ligne:bg-creux' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`${COLONNE_HEURE} text-sm font-semibold tabular-nums ${couleur}`}
        >
          {heure}
        </span>
        <CaseTache titre={tache.titre} occupee={occupee} onCocher={onCocher} />
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
              {contenu}
            </button>
          ) : fiche !== null ? (
            <Link to={fiche} className={CLASSES_ZONE}>
              {contenu}
            </Link>
          ) : (
            <button type="button" onClick={onOuvrir} className={CLASSES_ZONE}>
              {contenu}
            </button>
          )}

          {/* Ordinateur : Itinéraire vient par-dessus la fin du texte, au survol ou au clavier. */}
          {survol && adresse !== null && (
            <div className={`absolute inset-y-0 right-0 flex ${VISIBLE_AU_SURVOL}`}>
              <span aria-hidden="true" className="w-6 bg-linear-to-r from-transparent to-creux" />
              <div className="flex items-center bg-creux pr-1">{itineraire(true)}</div>
            </div>
          )}
        </div>
      </div>

      {ouverte && (
        <div id={idGestes} className="flex flex-wrap items-center gap-2 pb-3 pl-[6.25rem]">
          {itineraire(false)}
          {fiche !== null ? (
            <LienBouton
              icone={bien !== null ? 'biens' : 'contacts'}
              variante="discret"
              vers={fiche}
              aria-label={
                bien !== null
                  ? 'Ouvrir la fiche du bien'
                  : `Ouvrir la fiche ${contact === null ? 'de ce contact' : deNom(nomComplet(contact))}`
              }
            >
              Fiche
            </LienBouton>
          ) : (
            <Bouton variante="discret" icone="modifier" disabled={occupee} onClick={onOuvrir}>
              <span className="text-sm">Ouvrir</span>
            </Bouton>
          )}
        </div>
      )}
    </li>
  )
}
