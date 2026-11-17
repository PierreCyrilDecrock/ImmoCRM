import { useEffect, useState } from 'react'
import Bouton from '../../components/Bouton'
import Carte from '../../components/Carte'
import Etiquette from '../../components/Etiquette'
import LigneListe from '../../components/LigneListe'
import Message from '../../components/Message'
import { formaterDate } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import type { Bien } from '../biens/biens'
import { nomComplet } from '../contacts/contacts'
import {
  genreReaction,
  libelleReaction,
  listerPropositionsDuBien,
  type PropositionDuBien,
} from './biens-proposes'
import DemandeEntrante from './DemandeEntrante'
import { genreEtatAcquereur, libelleEtatAcquereur, resumeOrigine } from './pipeline-acquereur'
import { listerDemandesSurBien, type ProjetAcquereurAffiche } from './projets-acquereurs'

type Props = {
  bien: Bien
  lectureSeule?: boolean
}

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; propositions: PropositionDuBien[]; demandes: ProjetAcquereurAffiche[] }

/**
 * Rubrique « Acquéreurs » d'une fiche Bien : à qui le bien a été proposé (avec la réaction),
 * et les demandes reçues sur ce bien. Les comptes rendus de visite sont dans le journal du
 * bien.
 */
export default function SectionAcquereursDuBien({ bien, lectureSeule = false }: Props) {
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [demande, setDemande] = useState(false)

  useEffect(() => {
    let actif = true
    const client = exigerSupabase()
    void Promise.all([
      listerPropositionsDuBien(client, bien.id),
      listerDemandesSurBien(client, bien.id),
    ]).then(([propositions, demandes]) => {
      if (!actif) return
      if (!propositions.ok) setEtat({ phase: 'erreur', message: propositions.erreur.message })
      else if (!demandes.ok) setEtat({ phase: 'erreur', message: demandes.erreur.message })
      else {
        // Une demande déjà suivie d'une proposition n'apparaît qu'une fois.
        const proposes = new Set(propositions.donnees.map((p) => p.propose.projet_acquereur_id))
        setEtat({
          phase: 'pret',
          propositions: propositions.donnees,
          demandes: demandes.donnees.filter((d) => !proposes.has(d.id)),
        })
      }
    })
    return () => {
      actif = false
    }
  }, [bien.id])

  return (
    <Carte titre="Acquéreurs">
      {etat.phase === 'chargement' && <p className="text-sm text-encre-douce">Chargement…</p>}
      {etat.phase === 'erreur' && (
        <Message genre="erreur">Les acquéreurs n'ont pas pu être lus. {etat.message}</Message>
      )}
      {etat.phase === 'pret' && etat.propositions.length === 0 && etat.demandes.length === 0 && (
        <p className="text-sm text-encre-douce">
          Ce bien n'a été proposé à aucun acquéreur, et aucune demande ne le concerne.
        </p>
      )}
      {etat.phase === 'pret' && (etat.propositions.length > 0 || etat.demandes.length > 0) && (
        <ul className="-mx-4 divide-y divide-bord">
          {etat.propositions.map(({ id, propose, contact, projet }) => (
            <LigneListe
              key={id}
              titre={contact === null ? 'Contact introuvable' : nomComplet(contact)}
              detail={`Proposé le ${formaterDate(propose.propose_le)}${
                propose.raison_refus === '' ? '' : ` · ${propose.raison_refus}`
              }`}
              fin={
                <Etiquette genre={genreReaction(propose.reaction)}>
                  {libelleReaction(propose.reaction)}
                </Etiquette>
              }
              vers={projet === null ? undefined : `/pipelines/acquereurs/${projet.id}`}
            />
          ))}
          {etat.demandes.map(({ id, projet, contact }) => (
            <LigneListe
              key={id}
              titre={contact === null ? 'Contact introuvable' : nomComplet(contact)}
              detail={`Demande ${resumeOrigine(projet).toLowerCase()}, le ${formaterDate(projet.recue_le ?? projet.created_at)}`}
              fin={
                <Etiquette genre={genreEtatAcquereur(projet.etat)}>
                  {libelleEtatAcquereur(projet.etat)}
                </Etiquette>
              }
              vers={`/pipelines/acquereurs/${id}`}
            />
          ))}
        </ul>
      )}
      {!lectureSeule && (
        <div className="mt-3">
          <Bouton variante="secondaire" icone="ajouter" onClick={() => setDemande(true)}>
            Demande sur ce bien
          </Bouton>
        </div>
      )}
      {demande && <DemandeEntrante bien={bien} onFermer={() => setDemande(false)} />}
    </Carte>
  )
}
