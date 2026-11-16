import { describe, expect, it, vi } from 'vitest'
import {
  contactFictif,
  insererDonneesFictives,
  NOMBRE_CONTACTS_FICTIFS,
  personneFictive,
  personnesFictives,
  telephoneFictif,
  type JeuFictif,
} from './donnees-fictives'
import { fauxClient } from './faux-client'

describe('personnes fictives', () => {
  it('sont clairement fausses : téléphone réservé, courriel en .invalid, ville inexistante', () => {
    for (const personne of personnesFictives(200)) {
      expect(personne.telephone).toMatch(/^06 39 98 \d{2} \d{2}$/)
      expect(personne.courriel).toMatch(/^[a-z]+\.[a-z]+\d+@exemple\.invalid$/)
      expect(personne.codePostal).toBe('00000')
      expect(personne.ville).toBe('Villefictive')
      expect(personne.adresse).toMatch(/^[1-9]\d? /)
    }
  })

  it('sont toujours les mêmes pour un même rang', () => {
    expect(personneFictive(3)).toEqual(personneFictive(3))
    expect(personneFictive(0)).toMatchObject({ prenom: 'Camille', nom: 'Fictif' })
  })

  it('ont des courriels tous différents', () => {
    const courriels = personnesFictives(200).map((personne) => personne.courriel)
    expect(new Set(courriels).size).toBe(200)
  })

  it('numérote les téléphones sur quatre chiffres', () => {
    expect(telephoneFictif(7)).toBe('06 39 98 00 07')
    expect(telephoneFictif(1234)).toBe('06 39 98 12 34')
  })
})

describe('insererDonneesFictives', () => {
  const jeu = (lignes: number): JeuFictif => ({
    libelle: 'Contacts',
    inserer: vi.fn(() => Promise.resolve({ ok: true as const, donnees: lignes })),
  })

  it('refuse sur le projet réel, sans rien envoyer', async () => {
    const { client, appels } = fauxClient({ data: null, error: null })
    const contacts = jeu(5)
    const bilan = await insererDonneesFictives(client, 'reel', [contacts])
    expect(bilan).toEqual({
      ok: false,
      message: 'Les données fictives ne peuvent être ajoutées que sur le projet de test.',
    })
    expect(contacts.inserer).not.toHaveBeenCalled()
    expect(appels).toEqual([])
  })

  it('insère tous les lots sur le projet de test et compte les lignes', async () => {
    const { client } = fauxClient({ data: null, error: null })
    const bilan = await insererDonneesFictives(client, 'test', [jeu(5), jeu(3)])
    expect(bilan).toEqual({ ok: true, lignes: 8 })
  })

  it('s’arrête au premier lot en échec et dit lequel', async () => {
    const { client } = fauxClient({ data: null, error: null })
    const enEchec: JeuFictif = {
      libelle: 'Biens',
      inserer: () =>
        Promise.resolve({
          ok: false as const,
          erreur: { genre: 'droits' as const, message: "Cette action n'est pas autorisée." },
        }),
    }
    const suivant = jeu(2)
    const bilan = await insererDonneesFictives(client, 'test', [enEchec, suivant])
    expect(bilan).toEqual({ ok: false, message: "Biens : Cette action n'est pas autorisée." })
    expect(suivant.inserer).not.toHaveBeenCalled()
  })
})

describe('contacts fictifs', () => {
  const contacts = Array.from({ length: NOMBRE_CONTACTS_FICTIFS }, (_, rang) => contactFictif(rang))

  it('sont clairement faux et marqués comme tels', () => {
    for (const contact of contacts) {
      expect(contact.telephones).toHaveLength(1)
      expect(contact.telephones?.[0]).toMatch(/^\+3363998\d{4}$/)
      expect(contact.courriels?.[0]).toMatch(/@exemple\.invalid$/)
      expect(contact.code_postal).toBe('00000')
      expect(contact.ville).toBe('Villefictive')
      expect(contact.etiquettes).toContain('fictif')
    }
  })

  it('respectent ce que la base accepte : un nom, des valeurs connues', () => {
    for (const contact of contacts) {
      if (contact.type === 'societe') expect(contact.raison_sociale).not.toBe('')
      else expect(contact.nom).not.toBe('')
      expect(['personne', 'societe']).toContain(contact.type)
      expect(['chaud', 'tiede', 'froid', 'veille']).toContain(contact.temperature)
      for (const role of contact.roles ?? []) {
        expect(['vendeur', 'acquereur', 'notaire', 'prescripteur', 'autre']).toContain(role)
      }
    }
  })

  it('mélangent personnes et sociétés', () => {
    const types = new Set(contacts.map((contact) => contact.type))
    expect(types).toEqual(new Set(['personne', 'societe']))
  })

  it('font partie des lots insérés sur le projet de test', async () => {
    const { client, appels } = fauxClient({ data: { id: 'x' }, error: null })
    const bilan = await insererDonneesFictives(client, 'test')
    expect(bilan).toEqual({ ok: true, lignes: NOMBRE_CONTACTS_FICTIFS })
    expect(appels.filter((appel) => appel[0] === 'insert')).toHaveLength(NOMBRE_CONTACTS_FICTIFS)
  })
})
