import { describe, expect, it } from 'vitest'
import {
  adresseFiche,
  lireRecentes,
  MAX_RECENTES,
  noterConsultation,
  oublierFiche,
  type FicheRecente,
} from './recents'

function fiche(id: string, genre: FicheRecente['genre'] = 'contact', vue = 1): FicheRecente {
  return { genre, id, titre: `Fiche ${id}`, detail: '', vue }
}

describe('noterConsultation', () => {
  it('met la fiche consultée en tête', () => {
    const liste = noterConsultation([fiche('a'), fiche('b')], fiche('c'))
    expect(liste.map((f) => f.id)).toEqual(['c', 'a', 'b'])
  })

  it('remonte une fiche déjà présente sans la doubler, avec son titre à jour', () => {
    const liste = noterConsultation([fiche('a'), fiche('b')], {
      ...fiche('b', 'contact', 2),
      titre: 'Nouveau nom',
    })
    expect(liste.map((f) => f.id)).toEqual(['b', 'a'])
    expect(liste[0]?.titre).toBe('Nouveau nom')
  })

  it('distingue un contact et un bien qui auraient le même identifiant', () => {
    const liste = noterConsultation([fiche('a', 'contact')], fiche('a', 'bien'))
    expect(liste).toHaveLength(2)
  })

  it('garde au plus le nombre prévu de fiches', () => {
    let liste: FicheRecente[] = []
    for (let rang = 0; rang < MAX_RECENTES + 5; rang++) {
      liste = noterConsultation(liste, fiche(String(rang)))
    }
    expect(liste).toHaveLength(MAX_RECENTES)
    expect(liste[0]?.id).toBe(String(MAX_RECENTES + 4))
  })
})

describe('oublierFiche', () => {
  it('retire la fiche demandée seulement', () => {
    const liste = oublierFiche([fiche('a'), fiche('a', 'bien'), fiche('b')], {
      genre: 'contact',
      id: 'a',
    })
    expect(liste.map((f) => `${f.genre}-${f.id}`)).toEqual(['bien-a', 'contact-b'])
  })
})

describe('lireRecentes', () => {
  it('relit une liste enregistrée', () => {
    const liste = [fiche('a'), fiche('b', 'vendeur')]
    expect(lireRecentes(JSON.stringify(liste))).toEqual(liste)
  })

  it('ignore une liste absente, abîmée ou des éléments inconnus', () => {
    expect(lireRecentes(null)).toEqual([])
    expect(lireRecentes('{pas du json')).toEqual([])
    expect(lireRecentes('{"genre":"contact"}')).toEqual([])
    expect(lireRecentes(JSON.stringify([fiche('a'), { genre: 'inconnu', id: 'x' }]))).toEqual([
      fiche('a'),
    ])
  })
})

describe('adresseFiche', () => {
  it('mène à la bonne page', () => {
    expect(adresseFiche({ genre: 'contact', id: '1' })).toBe('/contacts/1')
    expect(adresseFiche({ genre: 'bien', id: '2' })).toBe('/biens/2')
    expect(adresseFiche({ genre: 'vendeur', id: '3' })).toBe('/pipelines/vendeurs/3')
    expect(adresseFiche({ genre: 'acquereur', id: '4' })).toBe('/pipelines/acquereurs/4')
  })
})
