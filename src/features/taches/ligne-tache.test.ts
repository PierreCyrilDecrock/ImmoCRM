import { describe, expect, it } from 'vitest'
import { bienEssai } from '../biens/bien-essai'
import { contactEssai } from '../contacts/contact-essai'
import { adresseUnique, detailLigneTache, jourAffiche, jourDeLaVue } from './ligne-tache'
import { tacheEssai } from './tache-essai'

// Mardi 24 novembre 2026.
const AUJOURDHUI = '2026-11-24'

describe('jourDeLaVue', () => {
  it("donne le jour de l'onglet Aujourd'hui", () => {
    expect(jourDeLaVue('aujourdhui', AUJOURDHUI)).toBe(AUJOURDHUI)
  })

  it('ne masque rien dans les vues de plusieurs jours, ni hors de la page Tâches', () => {
    expect(jourDeLaVue('en_retard', AUJOURDHUI)).toBeNull()
    expect(jourDeLaVue('semaine', AUJOURDHUI)).toBeNull()
    expect(jourDeLaVue('plus_tard', AUJOURDHUI)).toBeNull()
    expect(jourDeLaVue('terminees', AUJOURDHUI)).toBeNull()
    expect(jourDeLaVue(undefined, AUJOURDHUI)).toBeNull()
  })
})

describe('jourAffiche', () => {
  it("n'écrit pas le jour de l'onglet", () => {
    expect(jourAffiche(AUJOURDHUI, AUJOURDHUI, AUJOURDHUI)).toBeNull()
  })

  it("écrit « Aujourd'hui » hors de l'onglet (fiche, autre vue)", () => {
    expect(jourAffiche(AUJOURDHUI, AUJOURDHUI, null)).toBe("Aujourd'hui")
  })

  it('écrit un autre jour simplement', () => {
    expect(jourAffiche('2026-11-23', AUJOURDHUI, AUJOURDHUI)).toBe('Hier')
    expect(jourAffiche('2026-11-25', AUJOURDHUI, null)).toBe('Demain')
  })
})

describe('adresseUnique', () => {
  const bien = bienEssai({
    adresse: '12 rue Imaginaire',
    code_postal: '00000',
    ville: 'Fictiveville',
  })

  it('préfère le lieu de la tâche au bien lié', () => {
    expect(adresseUnique('Café de la Place', bien, false)).toBe('Café de la Place')
  })

  it('prend le bien lié quand le lieu est vide (ou fait de blancs)', () => {
    expect(adresseUnique('  ', bien, false)).toBe('12 rue Imaginaire, 00000 Fictiveville')
  })

  it('ne répète pas le bien sur sa propre fiche', () => {
    expect(adresseUnique('', bien, true)).toBeNull()
    expect(adresseUnique('Agence', bien, true)).toBe('Agence')
  })

  it('ne donne rien sans lieu ni bien', () => {
    expect(adresseUnique('', null, false)).toBeNull()
  })
})

describe('detailLigneTache', () => {
  const contact = contactEssai({ prenom: 'Camille', nom: 'Fictif' })
  const bien = bienEssai({ adresse: '12 rue Imaginaire', code_postal: '', ville: '' })

  it("dans l'onglet Aujourd'hui, garde l'heure et tait le jour", () => {
    const detail = detailLigneTache(
      {
        tache: tacheEssai({ echeance: AUJOURDHUI, heure: '14:30:00', lieu: 'Mairie' }),
        contact,
        bien,
      },
      { aujourdhui: AUJOURDHUI, jourMasque: AUJOURDHUI },
    )
    expect(detail.jour).toBeNull()
    expect(detail.horaire).toBe('14 h 30')
    expect(detail.autres).toEqual(['Camille Fictif', 'Mairie'])
  })

  it('signale le retard et écrit le jour hors de son onglet', () => {
    const detail = detailLigneTache(
      { tache: tacheEssai({ echeance: '2026-11-23' }), contact: null, bien },
      { aujourdhui: AUJOURDHUI },
    )
    expect(detail.jour).toBe('Hier')
    expect(detail.enRetard).toBe(true)
    expect(detail.autres).toEqual(['12 rue Imaginaire'])
  })

  it("une tâche close n'est pas en retard", () => {
    const detail = detailLigneTache(
      { tache: tacheEssai({ echeance: '2026-11-20', etat: 'faite' }), contact: null, bien: null },
      { aujourdhui: AUJOURDHUI },
    )
    expect(detail.enRetard).toBe(false)
  })

  it('ne répète pas la fiche affichée, et donne la catégorie faute de mieux', () => {
    const detail = detailLigneTache(
      { tache: tacheEssai({ echeance: AUJOURDHUI, categorie: 'relance' }), contact, bien: null },
      { aujourdhui: AUJOURDHUI, masquer: 'contact' },
    )
    expect(detail.autres).toEqual(['Relance'])
  })
})
