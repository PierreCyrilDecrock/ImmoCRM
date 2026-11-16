import { describe, expect, it } from 'vitest'
import { contactEssai } from './contact-essai'
import {
  COLONNES_NON_EXPORTEES,
  nomFichierExport,
  RUBRIQUES_EXPORT,
  texteExportContact,
} from './export-contact'

const contact = contactEssai({
  civilite: 'mme',
  telephones: ['+33639980001'],
  courriels: ['camille.fictif@exemple.invalid'],
  adresse: "1 rue de l'Exemple",
  code_postal: '00000',
  ville: 'Villefictive',
  notes: 'Première ligne.\nSeconde ligne.',
  roles: ['vendeur'],
  etiquettes: ['fictif'],
  source: 'pige',
  source_detail: 'Annonce fictive',
  temperature: 'chaud',
  collecte_origine: 'Annonce publique fictive',
  collecte_date: '2026-05-04',
  accord_appel: 'oui',
  accord_appel_date: '2026-09-15',
  accord_appel_preuve: 'Accord fictif de vive voix',
})

describe('texteExportContact', () => {
  it('couvre toutes les colonnes de la table des contacts', () => {
    const exportees = RUBRIQUES_EXPORT.flatMap((rubrique) =>
      rubrique.lignes.map((ligne) => ligne.colonne),
    )
    const couvertes = [...exportees, ...COLONNES_NON_EXPORTEES].sort()
    // Une colonne ajoutée à la table doit être ajoutée à l'export (ou écartée en le disant).
    expect(couvertes).toEqual(Object.keys(contactEssai()).sort())
  })

  it('écrit les données en clair, rubrique par rubrique', () => {
    const texte = texteExportContact({ contact, fichesFusionnees: [], appels: [] }, '2026-11-16')
    expect(texte).toContain('DONNÉES PERSONNELLES — Camille Fictif')
    expect(texte).toContain('Document établi le 16 novembre 2026')
    expect(texte).toContain('Civilité : Mme')
    expect(texte).toContain('Téléphones : 06 39 98 00 01')
    expect(texte).toContain('Courriels : camille.fictif@exemple.invalid')
    expect(texte).toContain('Température : Chaud (projet dans les 3 mois)')
    expect(texte).toContain('Source : Pige')
    expect(texte).toContain('Date de collecte : 4 mai 2026')
    expect(texte).toContain('Accord pour être appelé : Oui')
    expect(texte).toContain("Date de l'accord ou du refus : 15 septembre 2026")
    expect(texte).toContain("Comment l'accord a été obtenu : Accord fictif de vive voix")
    expect(texte).toContain('Opposition au démarchage : Non')
    expect(texte).toContain('Notes :\nPremière ligne.\nSeconde ligne.')
    expect(texte).toContain('APPELS PASSÉS SANS ACCORD ENREGISTRÉ\n')
    expect(texte).toContain('Aucun.')
  })

  it('écrit « non renseigné » pour une valeur absente', () => {
    const texte = texteExportContact({ contact: contactEssai(), fichesFusionnees: [], appels: [] })
    expect(texte).toContain('Adresse : non renseigné')
    expect(texte).toContain('Recommandé par : non renseigné')
  })

  it('ne donne pas le nom du contact qui a recommandé (donnée d’un tiers)', () => {
    const texte = texteExportContact({
      contact: contactEssai({ recommande_par_id: '00000000-0000-4000-8000-000000000009' }),
      fichesFusionnees: [],
      appels: [],
    })
    expect(texte).toContain('Recommandé par : un autre contact du fichier')
    expect(texte).not.toContain('00000000-0000-4000-8000-000000000009')
  })

  it('ajoute les appels sans accord et les anciennes fiches fusionnées', () => {
    const texte = texteExportContact({
      contact,
      fichesFusionnees: [contactEssai({ prenom: 'Cam', adresse: '2 avenue du Test' })],
      appels: [
        {
          id: 'a1',
          user_id: 'u',
          created_at: '2026-11-10T10:00:00Z',
          updated_at: '2026-11-10T10:00:00Z',
          archived_at: null,
          contact_id: contact.id,
          motif: 'appel_entrant',
          detail: 'Rappel demandé',
          telephone: '+33639980001',
        },
      ],
    })
    expect(texte).toContain(
      '- 10 novembre 2026 — 06 39 98 00 01 — motif : Appel entrant — Rappel demandé',
    )
    expect(texte).toContain('ANCIENNE FICHE EN DOUBLE 1 — Cam Fictif')
    expect(texte).toContain('Adresse : 2 avenue du Test')
  })
})

describe('nomFichierExport', () => {
  it('fabrique un nom de fichier sans accent ni espace', () => {
    expect(nomFichierExport(contactEssai({ prenom: 'Zoé', nom: "D'Exemple" }), '2026-11-16')).toBe(
      'donnees-zoe-d-exemple-2026-11-16.txt',
    )
    expect(
      nomFichierExport(
        contactEssai({ type: 'societe', raison_sociale: 'Étude Factice & associés' }),
        '2026-11-16',
      ),
    ).toBe('donnees-etude-factice-associes-2026-11-16.txt')
  })
})
