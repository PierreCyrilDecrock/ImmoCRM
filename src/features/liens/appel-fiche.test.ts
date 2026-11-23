import { describe, expect, it } from 'vitest'
import { contactEssai } from '../contacts/contact-essai'
import { lienAppel } from '../contacts/telephone'
import { appelFiche } from './appel-fiche'

describe('appelFiche', () => {
  const sansAccord = contactEssai({ prenom: 'Lou', nom: 'Essai', telephones: ['0600000001'] })
  const avecAccord = contactEssai({
    prenom: 'Camille',
    nom: 'Fictif',
    telephones: ['0600000002'],
    accord_appel: 'oui',
  })

  it('appelle la première personne qui accepte d’être appelé', () => {
    expect(appelFiche([sansAccord, avecAccord], 'personne')).toEqual({
      lien: lienAppel('0600000002'),
      annonce: 'Appeler Camille Fictif',
    })
  })

  it('reste grisé, avec la raison, sinon', () => {
    expect(appelFiche([], 'aucun propriétaire lié')).toEqual({
      annonce: 'Appeler : aucun propriétaire lié',
    })
    expect(appelFiche([{ ...avecAccord, telephones: [] }], 'personne')).toEqual({
      annonce: 'Appeler : aucun numéro',
    })
    expect(appelFiche([sansAccord], 'personne')).toEqual({
      annonce: 'Appel bloqué : aucun accord pour être appelé',
    })
  })
})
