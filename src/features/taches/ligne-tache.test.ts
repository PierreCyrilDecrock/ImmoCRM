import { describe, expect, it } from 'vitest'
import { bienEssai } from '../biens/bien-essai'
import { contactEssai } from '../contacts/contact-essai'
import {
  adresseUnique,
  depuisRetard,
  detailLigneTache,
  jourAffiche,
  jourDeLaVue,
  titreSansNom,
} from './ligne-tache'
import { tacheEssai } from './tache-essai'

// Mardi 24 novembre 2026.
const AUJOURDHUI = '2026-11-24'

describe('jourDeLaVue', () => {
  it("donne le jour de la rubrique Aujourd'hui de l'onglet « À faire »", () => {
    expect(jourDeLaVue('a_faire', AUJOURDHUI)).toBe(AUJOURDHUI)
  })

  it('ne masque rien dans les vues de plusieurs jours, ni hors de la page Tâches', () => {
    expect(jourDeLaVue('semaine', AUJOURDHUI)).toBeNull()
    expect(jourDeLaVue('plus_tard', AUJOURDHUI)).toBeNull()
    expect(jourDeLaVue('terminees', AUJOURDHUI)).toBeNull()
    expect(jourDeLaVue(undefined, AUJOURDHUI)).toBeNull()
  })
})

describe('depuisRetard', () => {
  it('dit le retard en durée, et en toutes lettres aux lecteurs d’écran', () => {
    expect(depuisRetard('2026-11-18', AUJOURDHUI)).toEqual({
      texte: 'Depuis 6 j',
      annonce: 'En retard de 6 jours',
    })
    expect(depuisRetard('2026-11-23', AUJOURDHUI)).toEqual({
      texte: 'Depuis hier',
      annonce: "En retard d'un jour",
    })
  })

  it('ne dit rien pour une tâche du jour ou à venir', () => {
    expect(depuisRetard(AUJOURDHUI, AUJOURDHUI)).toBeNull()
    expect(depuisRetard('2026-11-25', AUJOURDHUI)).toBeNull()
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

  it("dans la rubrique Aujourd'hui, garde l'heure et tait le jour", () => {
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
    // Le jour n'est pas écrit : l'heure ouvre la ligne de détail.
    expect(detail.heureEnTete).toBe(true)
    expect(detail.autres).toEqual(['Camille Fictif', 'Mairie'])
  })

  it('dans « À faire », dit le retard en durée, en rouge', () => {
    const detail = detailLigneTache(
      { tache: tacheEssai({ echeance: '2026-11-18', heure: '10:00:00' }), contact: null, bien },
      { aujourdhui: AUJOURDHUI, jourMasque: AUJOURDHUI, retardEnDuree: true },
    )
    expect(detail.jour).toBe('Depuis 6 j')
    expect(detail.annonceJour).toBe('En retard de 6 jours')
    expect(detail.enRetard).toBe(true)
    // Le retard ouvre la ligne, avant la priorité ; l'heure vient après.
    expect(detail.jourEnTete).toBe(true)
    expect(detail.heureEnTete).toBe(false)
  })

  it('garde le jour des autres vues, et l’heure après lui', () => {
    const detail = detailLigneTache(
      { tache: tacheEssai({ echeance: '2026-11-26', heure: '09:00:00' }), contact: null, bien },
      { aujourdhui: AUJOURDHUI, retardEnDuree: false },
    )
    expect(detail.jour).toBe('jeu. 26 nov.')
    expect(detail.annonceJour).toBeNull()
    expect(detail.jourEnTete).toBe(false)
    expect(detail.heureEnTete).toBe(false)
  })

  it("sans heure, rien n'ouvre la ligne avant la priorité", () => {
    const detail = detailLigneTache(
      { tache: tacheEssai({ echeance: AUJOURDHUI }), contact: null, bien: null },
      { aujourdhui: AUJOURDHUI, jourMasque: AUJOURDHUI },
    )
    expect(detail.heureEnTete).toBe(false)
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

  it('ne répète pas le contact déjà nommé dans le titre, et donne alors le motif', () => {
    const detail = detailLigneTache(
      {
        tache: tacheEssai({
          titre: 'Relancer Camille FICTIF',
          motif: 'Retour sur l’avis de valeur',
          echeance: AUJOURDHUI,
          categorie: 'relance',
        }),
        contact,
        bien: null,
      },
      { aujourdhui: AUJOURDHUI },
    )
    expect(detail.autres).toEqual(['Retour sur l’avis de valeur'])
  })

  it('garde le contact quand le titre ne le nomme pas', () => {
    const detail = detailLigneTache(
      {
        tache: tacheEssai({ titre: 'Envoyer le mandat', echeance: AUJOURDHUI }),
        contact,
        bien: null,
      },
      { aujourdhui: AUJOURDHUI },
    )
    expect(detail.autres).toEqual(['Camille Fictif'])
  })
})

describe('titreSansNom', () => {
  it('retire le nom cité, sans tenir compte des majuscules', () => {
    expect(titreSansNom('Relancer Camille FICTIF', 'Camille Fictif')).toBe('Relancer')
    expect(titreSansNom('Appeler Camille Fictif, puis écrire', 'Camille Fictif')).toBe(
      'Appeler, puis écrire',
    )
  })
  it('rend null quand le titre ne nomme pas le contact', () => {
    expect(titreSansNom('Envoyer le mandat', 'Camille Fictif')).toBeNull()
    expect(titreSansNom('Envoyer le mandat', ' ')).toBeNull()
  })
})
