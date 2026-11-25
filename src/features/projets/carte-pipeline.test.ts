import { describe, expect, it } from 'vitest'
import { bienEssai } from '../biens/bien-essai'
import { contactEssai } from '../contacts/contact-essai'
import {
  actionPipeline,
  adresseCourte,
  ligneAnciennete,
  montantAcquereur,
  montantVendeur,
  titresCarteVendeur,
  totalColonne,
  valeurAcquereur,
  valeurVendeur,
} from './carte-pipeline'

// Les montants courts gardent leur unité par une espace insécable : on la ramène à une espace.
const lisible = (texte: string) => texte.replace(/\s/g, ' ')

const AUJOURDHUI = '2026-11-23'
const actif = { etat: 'actif' }

describe('actionPipeline', () => {
  it('annonce la tâche la plus proche du projet', () => {
    const prochaine = { echeance: '2026-11-27', titre: 'Envoyer l’avis de valeur' }
    expect(actionPipeline({ prochaine, contact: null, projet: actif }, AUJOURDHUI)).toEqual({
      texte: 'Vendredi · Envoyer l’avis de valeur',
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
      { texte: 'Relance mercredi', alerte: false },
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

describe('les jours en mots', () => {
  const relance = (date: string) =>
    actionPipeline(
      { prochaine: null, contact: { prochaine_action_le: date }, projet: actif },
      AUJOURDHUI,
    ).texte

  it('dit la relance du jour et du lendemain en mots', () => {
    expect(relance(AUJOURDHUI)).toBe('Relance aujourd’hui')
    expect(relance('2026-11-24')).toBe('Relance demain')
  })

  it('donne le jour de la semaine jusqu’à six jours, la date au-delà', () => {
    expect(relance('2026-11-29')).toBe('Relance dimanche')
    expect(relance('2026-11-30')).toBe('Relance lun. 30 nov.')
  })

  it('met le jour d’une tâche du projet en tête, avec une majuscule', () => {
    const tache = (echeance: string) =>
      actionPipeline(
        { prochaine: { echeance, titre: 'Rappeler' }, contact: null, projet: actif },
        AUJOURDHUI,
      ).texte
    expect(tache(AUJOURDHUI)).toBe('Aujourd’hui · Rappeler')
    expect(tache('2026-11-24')).toBe('Demain · Rappeler')
    expect(tache('2026-12-04')).toBe('ven. 4 déc. · Rappeler')
  })
})

describe('ligneAnciennete', () => {
  it('reste discrète jusqu’au seuil', () => {
    expect(ligneAnciennete('2026-10-24', AUJOURDHUI)).toEqual({
      texte: 'Depuis 30 jours',
      alerte: false,
    })
  })

  it('passe en alerte au-delà, avec sa raison', () => {
    expect(ligneAnciennete('2026-10-14', AUJOURDHUI)).toEqual({
      texte: 'Depuis 40 jours',
      alerte: true,
      raison: 'Plus de 30 jours à cette étape',
    })
  })
})

describe('la valeur d’un projet', () => {
  const vendeur = { prix_espere: null, estimation_basse: null, estimation_haute: null }

  it('donne le prix espéré du vendeur, en entier', () => {
    const valeur = valeurVendeur({ ...vendeur, prix_espere: 300_000 })
    expect(lisible(valeur.texte)).toBe('300 000 € espérés')
    expect(valeur.connue).toBe(true)
  })

  it('préfère l’estimation dès qu’elle existe', () => {
    const fourchette = {
      prix_espere: 480_000,
      estimation_basse: 410_000,
      estimation_haute: 440_000,
    }
    expect(lisible(valeurVendeur(fourchette).texte)).toBe('Estimé 410 – 440 k€')
    expect(lisible(valeurVendeur({ ...vendeur, estimation_haute: 425_000 }).texte)).toBe(
      'Estimé 425 k€',
    )
  })

  it('dit en gris que le prix reste à connaître', () => {
    expect(valeurVendeur(vendeur)).toEqual({ texte: 'Prix à connaître', connue: false })
  })

  it('donne le budget d’un acquéreur', () => {
    expect(lisible(valeurAcquereur({ budget_min: 200_000, budget_max: 300_000 }).texte)).toBe(
      'Budget 200 – 300 k€',
    )
    expect(lisible(valeurAcquereur({ budget_min: null, budget_max: 280_000 }).texte)).toBe(
      'Budget jusqu’à 280 k€',
    )
    expect(lisible(valeurAcquereur({ budget_min: 150_000, budget_max: null }).texte)).toBe(
      'Budget dès 150 k€',
    )
    expect(valeurAcquereur({ budget_min: null, budget_max: null })).toEqual({
      texte: 'Budget à préciser',
      connue: false,
    })
  })

  it('compte le même montant que la carte', () => {
    expect(montantVendeur({ ...vendeur, prix_espere: 300_000 })).toBe(300_000)
    expect(
      montantVendeur({
        prix_espere: 480_000,
        estimation_basse: 410_000,
        estimation_haute: 440_000,
      }),
    ).toBe(440_000)
    expect(montantVendeur(vendeur)).toBeNull()
    expect(montantAcquereur({ budget_max: 300_000 })).toBe(300_000)
    expect(montantAcquereur({ budget_max: null })).toBeNull()
  })
})

describe('totalColonne', () => {
  it('additionne les montants de la colonne', () => {
    const total = totalColonne([300_000, 420_000])
    expect(lisible(total.texte)).toBe('2 · 720 k€')
    expect(lisible(total.annonce)).toBe('2 projets, 720 000 € au total')
  })

  it('compte à part les projets sans montant', () => {
    const total = totalColonne([300_000, null, 420_000])
    expect(lisible(total.texte)).toBe('3 · 720 k€ · 1 sans montant')
    expect(lisible(total.annonce)).toBe('3 projets, 720 000 € au total, 1 sans montant')
    expect(totalColonne([null, null]).texte).toBe('2 · sans montant')
  })

  it('dit une colonne vide', () => {
    expect(totalColonne([])).toEqual({ texte: '0', annonce: 'Aucun projet' })
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
