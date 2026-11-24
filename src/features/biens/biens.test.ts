import { describe, expect, it } from 'vitest'
import { fauxClient } from '../../lib/faux-client'
import { bienEssai } from './bien-essai'
import {
  adresseBien,
  brouillonBienDepuis,
  brouillonBienVide,
  CATEGORIES_BIEN,
  champUtilise,
  CHAMPS_PAR_CATEGORIE,
  CHAMPS_PAR_TYPE,
  chercherBiens,
  evolutionPrix,
  libelleEtage,
  lireAges,
  libelleTypes,
  lireEtage,
  listerPrixBien,
  preparerBien,
  resumeBien,
  statutAffiche,
  TYPES_BIEN,
  type BrouillonBien,
  type ChampSelonType,
} from './biens'

// Le séparateur de milliers français est une espace insécable : on la ramène à une espace.
const lisible = (texte: string) => texte.replace(/\s/g, ' ')

const brouillon = (valeurs: Partial<BrouillonBien>): BrouillonBien => ({
  ...brouillonBienVide(),
  adresse: "12 rue de l'Exemple",
  type: 'appartement',
  categorie: 'ancien',
  ...valeurs,
})

/** Un brouillon où tous les champs propres à un type sont remplis, quel que soit le type. */
const TOUT_REMPLI: Partial<BrouillonBien> = {
  etage: '2',
  surface: '85,5',
  pieces: '4',
  chambres: '3',
  annee_construction: '1975',
  etat: 'bon',
  dpe_classe: 'C',
  dpe_valeur: '150',
  dpe_date: '2026-05-04',
  ges_classe: 'B',
  ges_valeur: '20',
  ges_date: '2026-05-04',
  copropriete: 'oui',
  charges_annuelles: '1 800',
  taxe_fonciere: '950',
  programme: 'Résidence fictive',
  lot: 'B204',
  date_livraison: '2027-09-30',
  viager_bouquet: '60000',
  viager_rente: '750',
  viager_occupation: 'occupe',
  viager_ages: '82 et 79',
  commerce_nature: 'murs',
  commerce_bail: 'Bail fictif 3-6-9',
  commerce_loyer: '14400',
  commerce_activite: 'Boulangerie fictive',
  surface_terrain: '640',
  constructible: 'oui',
  viabilise: 'non',
}

describe('champs par type', () => {
  const bien = (type: string, categorie: string | null = null) => ({ type, categorie })

  it('réserve à chaque type principal ses champs propres', () => {
    expect(champUtilise(bien('appartement'), 'etage')).toBe(true)
    expect(champUtilise(bien('maison'), 'etage')).toBe(false)
    expect(champUtilise(bien('maison'), 'chambres')).toBe(true)
    expect(champUtilise(bien('commerce'), 'commerce_bail')).toBe(true)
    expect(champUtilise(bien('commerce'), 'chambres')).toBe(false)
    expect(champUtilise(bien('terrain'), 'surface_terrain')).toBe(true)
    expect(champUtilise(bien('terrain'), 'pieces')).toBe(false)
    expect(champUtilise(bien('terrain'), 'dpe_classe')).toBe(false)
    expect(champUtilise(bien('inconnu'), 'surface')).toBe(false)
  })

  it('ajoute ceux du type secondaire', () => {
    expect(champUtilise(bien('appartement', 'ancien'), 'taxe_fonciere')).toBe(true)
    expect(champUtilise(bien('appartement', 'neuf'), 'taxe_fonciere')).toBe(false)
    expect(champUtilise(bien('maison', 'neuf'), 'programme')).toBe(true)
    expect(champUtilise(bien('maison', 'viager'), 'viager_rente')).toBe(true)
    expect(champUtilise(bien('commerce', 'ancien'), 'copropriete')).toBe(true)
    expect(champUtilise(bien('appartement'), 'copropriete')).toBe(false)
    // Un terrain n'a pas de type secondaire.
    expect(champUtilise(bien('terrain', 'viager'), 'viager_rente')).toBe(false)
  })

  it('connaît tous les types proposés', () => {
    expect(Object.keys(CHAMPS_PAR_TYPE).sort()).toEqual(TYPES_BIEN.map((t) => t.valeur).sort())
    expect(Object.keys(CHAMPS_PAR_CATEGORIE).sort()).toEqual(
      CATEGORIES_BIEN.map((c) => c.valeur).sort(),
    )
  })

  it('nomme les deux types ensemble', () => {
    expect(libelleTypes(bien('appartement', 'ancien'))).toBe('Appartement ancien')
    expect(libelleTypes(bien('maison', 'neuf'))).toBe('Maison neuve')
    expect(libelleTypes(bien('maison', 'viager'))).toBe('Maison en viager')
    expect(libelleTypes(bien('terrain', 'ancien'))).toBe('Terrain')
    expect(libelleTypes(bien('commerce'))).toBe('Commerce ou local')
  })
})

describe('preparerBien', () => {
  it('exige une adresse et un type, et rien d’autre', () => {
    const vide = preparerBien(brouillonBienVide())
    expect(vide).toEqual({
      ok: false,
      erreurs: { adresse: "Indiquez l'adresse du bien.", type: 'Choisissez le type de bien.' },
    })
    const minimal = preparerBien(brouillon({ adresse: '  3 impasse Fictive ' }))
    expect(minimal).toMatchObject({
      ok: true,
      valeurs: {
        adresse: '3 impasse Fictive',
        type: 'appartement',
        categorie: 'ancien',
        statut: 'repere',
        prix: null,
      },
    })
  })

  it('lit les nombres saisis à la française', () => {
    const preparation = preparerBien(brouillon({ ...TOUT_REMPLI, prix: '250 000 €' }))
    expect(preparation).toMatchObject({
      ok: true,
      valeurs: {
        prix: 250000,
        surface: 85.5,
        etage: 2,
        pieces: 4,
        charges_annuelles: 1800,
        copropriete: true,
        dpe_classe: 'C',
      },
    })
  })

  it.each(
    TYPES_BIEN.flatMap((type) =>
      ['', ...CATEGORIES_BIEN.map((c) => c.valeur)].map((categorie) => [type.valeur, categorie]),
    ),
  )('ne garde que les champs des types « %s » et « %s »', (type, categorie) => {
    const preparation = preparerBien(
      brouillon({
        ...TOUT_REMPLI,
        type: type as BrouillonBien['type'],
        categorie: categorie as BrouillonBien['categorie'],
      }),
      '2026-11-16',
    )
    if (!preparation.ok) throw new Error('le brouillon devrait être accepté')
    const valeurs: Record<string, unknown> = preparation.valeurs
    const enregistree = valeurs.categorie as string | null
    // Un terrain perd son type secondaire.
    expect(enregistree).toBe(type === 'terrain' || categorie === '' ? null : categorie)
    for (const champ of Object.keys(TOUT_REMPLI)) {
      const vide = [null, '', []].some(
        (rien) => JSON.stringify(rien) === JSON.stringify(valeurs[champ]),
      )
      // Rempli si le champ concerne ce bien, vidé sinon.
      const concerne = champUtilise({ type, categorie: enregistree }, champ as ChampSelonType)
      expect([champ, vide]).toEqual([champ, !concerne])
    }
  })

  it('ne signale pas d’erreur sur un champ que le type n’utilise pas', () => {
    const preparation = preparerBien(
      brouillon({ type: 'terrain', surface: 'grand', etage: 'haut' }),
    )
    expect(preparation.ok).toBe(true)
  })

  it('signale les saisies illisibles, champ par champ', () => {
    const preparation = preparerBien(
      brouillon({
        prix: 'cher',
        surface: '-3',
        annee_construction: '75',
        etage: 'haut',
        dpe_date: '2026-02-30',
        ges_date: '2027-01-01',
      }),
      '2026-11-16',
    )
    expect(preparation.ok).toBe(false)
    if (preparation.ok) return
    expect(Object.keys(preparation.erreurs).sort()).toEqual([
      'annee_construction',
      'dpe_date',
      'etage',
      'ges_date',
      'prix',
      'surface',
    ])
    expect(preparation.erreurs.ges_date).toBe('Cette date est dans le futur.')
  })

  it('accepte une date de livraison à venir', () => {
    const preparation = preparerBien(
      brouillon({ categorie: 'neuf', date_livraison: '2028-01-15' }),
      '2026-11-16',
    )
    expect(preparation).toMatchObject({ ok: true, valeurs: { date_livraison: '2028-01-15' } })
  })

  it('refuse des âges de crédirentiers illisibles', () => {
    const preparation = preparerBien(brouillon({ categorie: 'viager', viager_ages: 'âgés' }))
    expect(preparation).toMatchObject({ ok: false, erreurs: { viager_ages: expect.any(String) } })
  })
})

describe('brouillonBienDepuis', () => {
  it('redonne les mêmes valeurs après un aller-retour', () => {
    const bien = bienEssai({
      type: 'appartement',
      categorie: 'viager',
      prix: 120000,
      surface: 95.5,
      etage: 0,
      viager_ages: [82, 79],
      viager_occupation: 'occupe',
      dpe_classe: 'E',
    })
    expect(preparerBien(brouillonBienDepuis(bien))).toMatchObject({
      ok: true,
      valeurs: {
        prix: 120000,
        surface: 95.5,
        etage: 0,
        viager_ages: [82, 79],
        viager_occupation: 'occupe',
        dpe_classe: 'E',
      },
    })
  })
})

describe('lireEtage, lireAges', () => {
  it('lit un étage, le rez-de-chaussée et un sous-sol', () => {
    expect(lireEtage('3')).toBe(3)
    expect(lireEtage('RDC')).toBe(0)
    expect(lireEtage('-1')).toBe(-1)
    expect(lireEtage('')).toBeNull()
    expect(lireEtage('3e')).toBe('invalide')
    expect(lireEtage('250')).toBe('invalide')
  })

  it('lit un ou plusieurs âges', () => {
    expect(lireAges('82')).toEqual([82])
    expect(lireAges('82 et 79 ans')).toEqual([82, 79])
    expect(lireAges('82, 79')).toEqual([82, 79])
    expect(lireAges('')).toEqual([])
    expect(lireAges('12')).toBe('invalide')
    expect(lireAges('80, 81, 82, 83, 84')).toBe('invalide')
    expect(lireAges('environ 80')).toBe('invalide')
  })
})

describe('affichage', () => {
  it('écrit l’adresse sur une ligne', () => {
    expect(
      adresseBien(bienEssai({ complement: 'Bât. B', code_postal: '00000', ville: 'Villefictive' })),
    ).toBe("12 rue de l'Exemple, Bât. B, 00000 Villefictive")
    expect(adresseBien(bienEssai())).toBe("12 rue de l'Exemple")
  })

  it('résume un bien pour la liste', () => {
    const logement = bienEssai({ ville: 'Villefictive', pieces: 3, surface: 72.5, prix: 285000 })
    expect(lisible(resumeBien(logement))).toBe(
      'Villefictive · 285 000 € · Appartement ancien · 72,5 m² · 3 pièces',
    )
    const terrain = bienEssai({
      type: 'terrain',
      categorie: null,
      surface: 10,
      surface_terrain: 640,
    })
    expect(lisible(resumeBien(terrain))).toBe('Terrain · 640 m²')
  })

  it('nomme les étages', () => {
    expect(libelleEtage(0)).toBe('Rez-de-chaussée')
    expect(libelleEtage(1)).toBe('1er étage')
    expect(libelleEtage(4)).toBe('4e étage')
    expect(libelleEtage(-1)).toBe('Sous-sol (niveau -1)')
  })

  it('chiffre l’évolution d’un prix', () => {
    expect(lisible(evolutionPrix(240000, 250000))).toBe('− 10 000 € (− 4 %)')
    expect(lisible(evolutionPrix(262500, 250000))).toBe('+ 12 500 € (+ 5 %)')
    expect(evolutionPrix(250000, null)).toBe('')
    expect(evolutionPrix(250000, 250000)).toBe('')
  })
})

describe('accès aux données', () => {
  it('lit les biens par page, les plus récents d’abord', async () => {
    const { client, appels } = fauxClient({ data: [], error: null, count: 0 })
    await chercherBiens(client, { compter: true })
    expect(appels).toEqual([
      ['from', 'biens'],
      ['select', '*', { count: 'exact' }],
      ['is', 'archived_at', null],
      ['order', 'created_at', { ascending: false }],
      ['order', 'id', { ascending: true }],
      ['range', 0, 49],
    ])
  })

  it('lit l’historique des prix d’un bien, le plus récent d’abord', async () => {
    const { client, appels } = fauxClient({ data: [], error: null })
    await listerPrixBien(client, 'b1')
    expect(appels).toContainEqual(['from', 'biens_prix'])
    expect(appels).toContainEqual(['eq', 'bien_id', 'b1'])
    expect(appels).toContainEqual(['order', 'created_at', { ascending: false }])
  })
})

describe('statutAffiche', () => {
  it('écrit le statut avec sa majuscule, une couleur par phase', () => {
    expect(statutAffiche('en_estimation')).toEqual({ libelle: 'En estimation', genre: 'info' })
    expect(statutAffiche('en_mandat')).toEqual({ libelle: 'En mandat', genre: 'succes' })
    expect(statutAffiche('sous_offre')).toEqual({ libelle: 'Sous offre', genre: 'alerte' })
    expect(statutAffiche('vendu')).toEqual({ libelle: 'Vendu', genre: 'fort' })
  })

  it('met les autres statuts en gris', () => {
    expect(statutAffiche('repere')).toEqual({ libelle: 'Repéré', genre: 'neutre' })
    expect(statutAffiche('en_veille')).toEqual({ libelle: 'En veille', genre: 'neutre' })
    expect(statutAffiche('retire')).toEqual({ libelle: 'Retiré', genre: 'neutre' })
  })

  it('garde lisible un statut inconnu', () => {
    expect(statutAffiche('a_l_etude')).toEqual({ libelle: 'A l etude', genre: 'neutre' })
  })
})
