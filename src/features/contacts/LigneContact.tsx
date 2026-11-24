import LigneListe from '../../components/LigneListe'
import type { EtatParcours } from '../../lib/parcours'
import PastilleRetard from '../taches/PastilleRetard'
import { initialesDe } from '../saisie/recents'
import { nomComplet, nomDeListe, type Contact } from './contacts'
import InitialesRole from './InitialesRole'
import {
  detailLigneContact,
  detailSansAction,
  repereContact,
  rolesDuContact,
  teinteRole,
} from './ligne-contact'
import PuceTemperature from './PuceTemperature'

/**
 * Une ligne de la liste : les initiales colorées selon le rôle, « Camille **Fictif** », le
 * rôle et le dernier échange dessous ; à droite, le retard de la prochaine action, sinon la
 * température. Le téléphone n'est plus affiché : la recherche le trouve toujours.
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
  const repere = repereContact(contact, aujourdhui)
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
        sansAction
          ? detailSansAction(contact, aujourdhui, jamaisContacte)
          : detailLigneContact(contact, aujourdhui, jamaisContacte)
      }
      finTitre={
        repere === null ? undefined : repere.genre === 'retard' ? (
          <PastilleRetard texte={repere.texte} annonce={repere.annonce} />
        ) : (
          <PuceTemperature temperature={repere.temperature} texte={repere.texte} />
        )
      }
      vers={`/contacts/${contact.id}`}
      chevronDesTablette
      etat={etat}
    />
  )
}
