import { describe, expect, it } from 'vitest'
import { bienEssai } from '../biens/bien-essai'
import { contactEssai } from '../contacts/contact-essai'
import { brouillonDemande, preparerDemande } from './demande-entrante'

const AUJOURDHUI = '2026-11-17'
const MAINTENANT = { date: AUJOURDHUI, heure: '14:30' }

describe('preparerDemande', () => {
  const bien = bienEssai({ id: 'b1', adresse: '3 impasse Fictive' })
  const saisie = {
    ...brouillonDemande(MAINTENANT),
    prenom: 'Alex',
    nom: 'Spécimen',
    telephone: '06 39 98 00 42',
    portail: 'Leboncoin',
    bien,
  }

  it('crée un acquéreur venu d’une demande entrante, le projet et l’appel du jour', () => {
    const preparation = preparerDemande(saisie, AUJOURDHUI)
    expect(preparation.ok).toBe(true)
    if (!preparation.ok) return
    const { nouveauContact, projet, appel } = preparation.demande
    expect(nouveauContact).toMatchObject({
      prenom: 'Alex',
      nom: 'Spécimen',
      telephones: ['+33639980042'],
      courriels: [],
      roles: ['acquereur'],
      source: 'demande_entrante',
      source_detail: 'Portail Leboncoin, 3 impasse Fictive',
      collecte_origine: 'Demande entrante (Portail Leboncoin)',
      collecte_date: AUJOURDHUI,
      accord_appel: 'inconnu',
    })
    expect(projet).toEqual({
      etape: 'demande',
      origine: 'portail',
      portail: 'Leboncoin',
      bien_origine_id: 'b1',
      recue_le: '2026-11-17T13:30:00.000Z',
      notes: '',
    })
    expect(appel).toEqual({ titre: "Qualifier la demande d'Alex Spécimen", echeance: AUJOURDHUI })
  })

  it('note l’accord pour être appelé quand la personne demande à être rappelée', () => {
    const preparation = preparerDemande({ ...saisie, demandeRappel: true }, AUJOURDHUI)
    expect(preparation.ok && preparation.demande.nouveauContact).toMatchObject({
      accord_appel: 'oui',
      accord_appel_date: AUJOURDHUI,
      accord_appel_preuve: 'Demande de rappel reçue (Portail Leboncoin) le 17/11/2026 à 14 h 30',
    })
  })

  it('demande un nom et un moyen de répondre', () => {
    const preparation = preparerDemande(
      { ...brouillonDemande(MAINTENANT), prenom: 'Alex' },
      AUJOURDHUI,
    )
    expect(preparation.ok === false && Object.keys(preparation.erreurs).sort()).toEqual([
      'nom',
      'telephone',
    ])
  })

  it('refuse un téléphone illisible', () => {
    const preparation = preparerDemande({ ...saisie, telephone: '12' }, AUJOURDHUI)
    expect(preparation.ok === false && preparation.erreurs.telephone).toBeDefined()
  })

  it('rattache la demande à un contact existant, sans en créer', () => {
    const contact = contactEssai({ prenom: 'Camille', nom: 'Fictif' })
    const preparation = preparerDemande(
      { ...brouillonDemande(MAINTENANT, { contact }), origine: 'appel', message: 'Cherche T3' },
      AUJOURDHUI,
    )
    expect(preparation.ok && preparation.demande.nouveauContact).toBeNull()
    expect(preparation.ok && preparation.demande.projet.notes).toBe(
      'Message reçu le 17/11/2026 à 14 h 30 : Cherche T3',
    )
    expect(preparation.ok && preparation.demande.appel?.titre).toBe(
      'Qualifier la demande de Camille Fictif',
    )
  })

  it('peut ne pas prévoir d’appel, et refuse une réception future', () => {
    const sansAppel = preparerDemande({ ...saisie, planifierAppel: false }, AUJOURDHUI)
    expect(sansAppel.ok && sansAppel.demande.appel).toBeNull()
    const future = preparerDemande({ ...saisie, recueDate: '2026-11-18' }, AUJOURDHUI)
    expect(future.ok === false && future.erreurs.recue).toBeDefined()
  })
})
