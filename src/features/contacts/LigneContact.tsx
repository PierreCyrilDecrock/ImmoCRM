import LigneListe from '../../components/LigneListe'
import type { EtatParcours } from '../../lib/parcours'
import { initialesDe } from '../saisie/recents'
import { nomComplet, nomDeListe, type Contact } from './contacts'
import InitialesRole from './InitialesRole'
import { ligneGriseContact, repereContact, rolesDuContact, teinteRole } from './ligne-contact'
import PuceTemperature from './PuceTemperature'

/**
 * Une ligne de la liste : les initiales colorées selon le rôle, « Camille **Fictif** » et,
 * à droite du nom, toujours la température (rien si elle n'est pas renseignée). Dessous, le
 * rôle et le dernier échange, ou, si la prochaine action est passée, le retard en mots et en
 * rouge : « Acquéreur · relance en retard de 3 j ». Le téléphone n'est plus affiché : la
 * recherche le trouve toujours.
 */
export default function LigneContact({
  contact,
  aujourdhui,
  jamaisContacte,
  sansAction = false,
  etat,
}: {
  contact: Contact
  aujourdhui: string
  /** Réponse du journal pour une fiche jamais jointe en apparence (`useJamaisContactes`). */
  jamaisContacte: boolean | undefined
  /** Vue « Sans prochaine action » : la confirmation, si elle a été donnée. */
  sansAction?: boolean
  /** Gardé dans l'historique avec la fiche (le parcours de la liste). */
  etat?: EtatParcours
}) {
  const nom = nomDeListe(contact)
  const repere = repereContact(contact)
  const grise = ligneGriseContact(contact, aujourdhui, jamaisContacte, sansAction)
  return (
    <LigneListe
      debut={
        <InitialesRole
          initiales={initialesDe(nomComplet(contact))}
          teinte={teinteRole(contact)}
          role={rolesDuContact(contact)}
        />
      }
      titre={
        <>
          {nom.debut !== '' && <span className="font-normal">{nom.debut} </span>}
          <span className="font-semibold">{nom.nom}</span>
        </>
      }
      detail={
        grise.retard === null ? (
          grise.debut
        ) : (
          // Le rôle cède la place si la ligne est trop étroite ; le retard ne se coupe jamais.
          <span className="flex min-w-0">
            <span className="min-w-0 truncate">{grise.debut}</span>
            {/* Le point reste avec le retard : la coupure du rôle ne le mange pas. */}
            <span className="shrink-0 whitespace-pre">
              {' · '}
              <span className="font-medium text-danger">
                <span aria-hidden="true">{grise.retard.texte}</span>
                <span className="sr-only">{grise.retard.annonce}</span>
              </span>
            </span>
          </span>
        )
      }
      finTitre={
        repere === null ? undefined : (
          <PuceTemperature temperature={repere.temperature} texte={repere.texte} />
        )
      }
      vers={`/contacts/${contact.id}`}
      titreSurDeuxLignes
      chevronDesTablette
      etat={etat}
    />
  )
}
