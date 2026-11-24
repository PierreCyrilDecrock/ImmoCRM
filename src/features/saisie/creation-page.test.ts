import { describe, expect, it } from 'vitest'
import { actionDuPlus, creationDeclaree, declarerCreation } from './creation-page'

describe('actionDuPlus', () => {
  it('ouvre le menu quand la page ne déclare rien', () => {
    expect(actionDuPlus(null)).toEqual({
      genre: 'menu',
      libelle: 'Saisie rapide : créer un contact, une activité, une tâche…',
      bulle: 'Saisie rapide (N)',
    })
  })

  it('crée ce que montre la page, avec sa touche en bulle', () => {
    expect(actionDuPlus('contact')).toEqual({
      genre: 'creer',
      creation: 'contact',
      libelle: 'Nouveau contact',
      bulle: 'Nouveau contact (C)',
    })
    expect(actionDuPlus('bien').bulle).toBe('Nouveau bien (B)')
    expect(actionDuPlus('tache').bulle).toBe('Nouvelle tâche (T)')
    expect(actionDuPlus('demande').libelle).toBe('Nouvelle demande entrante')
  })

  it('n’invente pas de touche pour un projet vendeur', () => {
    expect(actionDuPlus('projetVendeur')).toEqual({
      genre: 'creer',
      creation: 'projetVendeur',
      libelle: 'Nouveau projet vendeur',
      bulle: 'Nouveau projet vendeur',
    })
  })
})

describe('declarerCreation', () => {
  it('suit la page affichée et s’efface avec elle', () => {
    expect(creationDeclaree()).toBeNull()
    const retirer = declarerCreation('contact')
    expect(creationDeclaree()).toBe('contact')
    retirer()
    expect(creationDeclaree()).toBeNull()
  })

  it('ne laisse pas l’ancienne page effacer la nouvelle', () => {
    const retirerContacts = declarerCreation('contact')
    const retirerBiens = declarerCreation('bien')
    // La page Contacts se retire après l'arrivée de la page Biens.
    retirerContacts()
    expect(creationDeclaree()).toBe('bien')
    retirerBiens()
    expect(creationDeclaree()).toBeNull()
  })

  it('suit l’onglet affiché des pipelines', () => {
    const retirerVendeurs = declarerCreation('projetVendeur')
    const retirerAcquereurs = declarerCreation('demande')
    retirerVendeurs()
    expect(creationDeclaree()).toBe('demande')
    retirerAcquereurs()
  })
})
