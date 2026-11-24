import { describe, expect, it } from 'vitest'
import { bienEssai } from '../biens/bien-essai'
import { contactEssai } from '../contacts/contact-essai'
import { actionPipeline, adresseCourte, titresCarteVendeur } from './carte-pipeline'

const AUJOURDHUI = '2026-11-23'
const actif = { etat: 'actif' }

describe('actionPipeline', () => {
  it('annonce la tâche la plus proche du projet', () => {
    const prochaine = { echeance: '2026-11-27', titre: 'Envoyer l’avis de valeur' }
    expect(actionPipeline({ prochaine, contact: null, projet: actif }, AUJOURDHUI)).toEqual({
      texte: 'ven. 27 nov. · Envoyer l’avis de valeur',
      alerte: false,
    })
  })

  it('dit en clair qu’une tâche du projet est en retard', () => {
    const prochaine = { echeance: '2026-11-21', titre: 'Rappeler' }
    expect(actionPipeline({ prochaine, contact: null, projet: actif }, AUJOURDHUI)).toEqual({
      texte: 'Rappeler · en retard · 2 j',
      alerte: true,
    })
  })

  it('se rabat sur la relance du contact, en retard ou non', () => {
    const enRetard = { prochaine_action_le: '2026-11-22' }
    expect(
      actionPipeline({ prochaine: null, contact: enRetard, projet: actif }, AUJOURDHUI),
    ).toEqual({ texte: 'Relance en retard · 1 j', alerte: true })
    const aVenir = { prochaine_action_le: '2026-11-25' }
    expect(actionPipeline({ prochaine: null, contact: aVenir, projet: actif }, AUJOURDHUI)).toEqual(
      { texte: 'Relance · mer. 25 nov.', alerte: false },
    )
    const duJour = { prochaine_action_le: AUJOURDHUI }
    expect(
      actionPipeline({ prochaine: null, contact: duJour, projet: actif }, AUJOURDHUI).alerte,
    ).toBe(false)
  })

  it('signale un projet sans action, mais rien pour un projet gagné', () => {
    const sans = { prochaine_action_le: null }
    expect(actionPipeline({ prochaine: null, contact: sans, projet: actif }, AUJOURDHUI)).toEqual({
      texte: 'Aucune action prévue',
      alerte: true,
    })
    expect(
      actionPipeline({ prochaine: null, contact: sans, projet: { etat: 'gagne' } }, AUJOURDHUI)
        .texte,
    ).toBe('')
  })
})

describe('carte d’un projet de vente', () => {
  it('met le bien en titre et le vendeur dessous', () => {
    const bien = bienEssai({
      adresse: '12 rue Fictive',
      code_postal: '00000',
      ville: 'Villefictive',
    })
    expect(titresCarteVendeur(contactEssai(), bien)).toEqual({
      titre: '12 rue Fictive',
      sousTitre: 'Camille Fictif',
    })
  })

  it('distingue deux projets du même vendeur par leur adresse', () => {
    const vendeur = contactEssai()
    const premier = titresCarteVendeur(vendeur, bienEssai({ adresse: '12 rue Fictive' }))
    const second = titresCarteVendeur(vendeur, bienEssai({ adresse: '3 impasse Inventée' }))
    expect(premier.titre).not.toBe(second.titre)
    expect(premier.sousTitre).toBe(second.sousTitre)
  })

  it('se rabat sur la commune, et dit ce qui manque', () => {
    expect(adresseCourte({ adresse: ' ', code_postal: '00000', ville: 'Villefictive' })).toBe(
      '00000 Villefictive',
    )
    expect(titresCarteVendeur(null, null)).toEqual({
      titre: 'Bien introuvable',
      sousTitre: 'Contact introuvable',
    })
  })
})
