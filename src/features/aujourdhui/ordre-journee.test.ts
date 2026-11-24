import { describe, expect, it } from 'vitest'
import { activiteEssai } from '../activites/activite-essai'
import { contactEssai } from '../contacts/contact-essai'
import type { Role } from '../contacts/contacts'
import { tacheEssai } from '../taches/tache-essai'
import type { Tache } from '../taches/taches'
import {
  comparerUrgence,
  compteurRappels,
  dernierEchange,
  echeanceADroite,
  filtrerRappels,
  grouperTaches,
  lireFiltreRappels,
  parUrgence,
  premieresRelances,
  RELANCES_D_EMBLEE,
  basculerRelance,
  relanceDeplieeAffichee,
  videAutresTaches,
  videRappels,
} from './ordre-journee'

const AUJOURDHUI = '2026-11-17'

const ligne = (id: string, valeurs: Partial<Tache> = {}) => ({
  id,
  tache: tacheEssai({ id, ...valeurs }),
})

const rappel = (id: string, roles: Role[] | null) => ({
  id,
  contact: roles === null ? null : contactEssai({ id: `c-${id}`, roles }),
})

describe('ordre par urgence', () => {
  it('met la plus en retard en premier', () => {
    const lignes = [
      ligne('a', { echeance: AUJOURDHUI }),
      ligne('b', { echeance: '2026-11-10' }),
      ligne('c', { echeance: '2026-11-15' }),
    ]
    expect(parUrgence(lignes).map((l) => l.id)).toEqual(['b', 'c', 'a'])
  })

  it('départage le même jour par la priorité, puis l’heure, puis l’ancienneté', () => {
    const lignes = [
      ligne('basse', { priorite: 3 }),
      ligne('sans-heure', { priorite: 2, heure: null }),
      ligne('haute', { priorite: 1 }),
      ligne('a-9h', { priorite: 2, heure: '09:00:00' }),
      ligne('recente', { priorite: 2, heure: '09:00:00', created_at: '2026-11-16T10:00:00Z' }),
    ]
    expect(parUrgence(lignes).map((l) => l.id)).toEqual([
      'haute',
      'a-9h',
      'recente',
      'sans-heure',
      'basse',
    ])
  })

  it('garde un ordre stable et ne modifie pas la liste reçue', () => {
    const lignes = [ligne('b'), ligne('a')]
    expect(parUrgence(lignes).map((l) => l.id)).toEqual(['a', 'b'])
    expect(lignes.map((l) => l.id)).toEqual(['b', 'a'])
    expect(comparerUrgence(lignes[0]!.tache, lignes[0]!.tache)).toBe(0)
  })
})

describe('filtre des relances', () => {
  const rappels = [
    rappel('v', ['vendeur']),
    rappel('a', ['acquereur']),
    rappel('va', ['vendeur', 'acquereur']),
    rappel('n', ['notaire']),
    rappel('p', []),
    rappel('sans', null),
  ]

  it('« Tous » garde tout, y compris les relances sans contact', () => {
    expect(filtrerRappels(rappels, 'tous').map((r) => r.id)).toEqual([
      'v',
      'a',
      'va',
      'n',
      'p',
      'sans',
    ])
  })

  it('« Acquéreurs » ne garde que les acquéreurs', () => {
    expect(filtrerRappels(rappels, 'acquereurs').map((r) => r.id)).toEqual(['a', 'va'])
  })

  it('« Vendeurs » ne garde que les vendeurs', () => {
    expect(filtrerRappels(rappels, 'vendeurs').map((r) => r.id)).toEqual(['v', 'va'])
  })

  it('le compteur suit le filtre', () => {
    expect(compteurRappels('tous', 42, 30, 30)).toEqual({ nombre: 42, partiel: false })
    expect(compteurRappels('acquereurs', 6, 6, 2)).toEqual({ nombre: 2, partiel: false })
    // Toutes les relances n'ont pas été lues : le nombre filtré est un minimum.
    expect(compteurRappels('vendeurs', 42, 30, 12)).toEqual({ nombre: 12, partiel: true })
  })

  it('montre les premières relances, puis tout à la demande', () => {
    const vingt = Array.from({ length: 20 }, (_, i) => i)
    const replie = premieresRelances(vingt, false)
    expect(replie.affichees).toHaveLength(RELANCES_D_EMBLEE)
    expect(replie.reste).toBe(20 - RELANCES_D_EMBLEE)
    expect(premieresRelances(vingt, true)).toEqual({ affichees: vingt, reste: 0 })
    expect(premieresRelances([1, 2], false)).toEqual({ affichees: [1, 2], reste: 0 })
  })

  it('dit quelque chose de positif quand le filtre ne laisse personne', () => {
    expect(videRappels('acquereurs').titre).toBe('Aucun acquéreur à rappeler.')
    expect(videRappels('vendeurs').titre).toBe('Aucun vendeur à rappeler.')
    expect(videRappels('tous').titre).toBe('Personne à rappeler.')
  })

  it('relit le filtre mémorisé, « Tous » par défaut', () => {
    expect(lireFiltreRappels('acquereurs')).toBe('acquereurs')
    expect(lireFiltreRappels('vendeurs')).toBe('vendeurs')
    expect(lireFiltreRappels(null)).toBe('tous')
    expect(lireFiltreRappels('notaires')).toBe('tous')
  })
})

describe('ligne d’une relance', () => {
  it('dit le dernier échange : quand, et de quel type', () => {
    const echange = (valeurs: Parameters<typeof activiteEssai>[0]) =>
      dernierEchange(activiteEssai(valeurs), AUJOURDHUI)
    expect(echange({ type: 'rendez_vous', date_activite: '2026-11-09' })).toBe(
      'Dernier échange il y a 8 jours · rendez-vous',
    )
    expect(echange({ type: 'appel', resultat: 'messagerie', date_activite: '2026-11-16' })).toBe(
      'Dernier échange hier · appel, messagerie',
    )
    expect(echange({ type: 'sms', date_activite: AUJOURDHUI })).toBe(
      "Dernier échange aujourd'hui · SMS",
    )
    expect(echange({ type: 'visite', date_activite: '2026-08-01' })).toBe(
      'Dernier échange il y a 3 mois · visite',
    )
    expect(echange({ type: 'note', date_activite: '2025-06-01' })).toBe(
      "Dernier échange il y a plus d'un an · note",
    )
    expect(dernierEchange(null, AUJOURDHUI)).toBe('Jamais contacté')
  })
})

describe('relance dépliée', () => {
  it('ne déplie qu’une relance à la fois ; la toucher de nouveau la replie', () => {
    expect(basculerRelance(null, 'a')).toBe('a')
    expect(basculerRelance('a', 'b')).toBe('b')
    expect(basculerRelance('a', 'a')).toBeNull()
  })

  it('ne garde dépliée qu’une relance encore affichée', () => {
    const lignes = [{ id: 'a' }, { id: 'b' }]
    expect(relanceDeplieeAffichee('b', lignes)).toBe('b')
    // Faite, reportée ou cachée par le filtre : rien ne reste déplié.
    expect(relanceDeplieeAffichee('c', lignes)).toBeNull()
    expect(relanceDeplieeAffichee(null, lignes)).toBeNull()
  })
})

describe('bloc Tâches', () => {
  it('regroupe en « En retard » puis « Aujourd’hui », par urgence', () => {
    const groupes = grouperTaches(
      [
        ligne('jour', { echeance: AUJOURDHUI }),
        ligne('hier', { echeance: '2026-11-16' }),
        ligne('vieille', { echeance: '2026-11-02' }),
      ],
      AUJOURDHUI,
    )
    expect(groupes.map((g) => [g.titre, g.lignes.map((l) => l.id)])).toEqual([
      ['En retard', ['vieille', 'hier']],
      ["Aujourd'hui", ['jour']],
    ])
  })

  it('n’affiche pas un groupe vide', () => {
    expect(grouperTaches([ligne('jour')], AUJOURDHUI).map((g) => g.cle)).toEqual(['du_jour'])
    expect(grouperTaches([], AUJOURDHUI)).toEqual([])
  })

  it('met à droite le jour d’une tâche en retard, l’heure d’une tâche du jour', () => {
    expect(echeanceADroite({ echeance: '2026-11-16', heure: '10:00:00' }, AUJOURDHUI)).toBe('Hier')
    expect(echeanceADroite({ echeance: '2026-11-12', heure: null }, AUJOURDHUI)).toBe(
      'jeu. 12 nov.',
    )
    expect(echeanceADroite({ echeance: AUJOURDHUI, heure: '17:30:00' }, AUJOURDHUI)).toBe('17 h 30')
    expect(echeanceADroite({ echeance: AUJOURDHUI, heure: null }, AUJOURDHUI)).toBe('')
  })
})

describe('videAutresTaches', () => {
  it('situe les relances et les rendez-vous qui restent, en gris', () => {
    expect(videAutresTaches({ relances: 8, rendezVous: 3 })).toEqual({
      titre: 'Rien d’autre que vos 8 relances et 3 rendez-vous.',
      texte: 'Ils sont plus haut, dans l’agenda et « À rappeler ».',
      ton: 'neutre',
    })
  })

  it('a sa tournure pour zéro et un', () => {
    expect(videAutresTaches({ relances: 8, rendezVous: 0 })).toMatchObject({
      titre: 'Rien d’autre que vos 8 relances.',
      texte: 'Elles sont plus haut, dans « À rappeler ».',
      ton: 'neutre',
    })
    expect(videAutresTaches({ relances: 1, rendezVous: 0 })).toMatchObject({
      titre: 'Rien d’autre que votre relance.',
      texte: 'Elle est plus haut, dans « À rappeler ».',
    })
    expect(videAutresTaches({ relances: 0, rendezVous: 3 })).toMatchObject({
      titre: 'Rien d’autre que vos 3 rendez-vous.',
      texte: 'Ils sont plus haut, dans l’agenda.',
    })
    expect(videAutresTaches({ relances: 0, rendezVous: 1 })).toMatchObject({
      titre: 'Rien d’autre que votre rendez-vous.',
      texte: 'Il est plus haut, dans l’agenda.',
    })
    expect(videAutresTaches({ relances: 1, rendezVous: 3 }).titre).toBe(
      'Rien d’autre que votre relance et vos 3 rendez-vous.',
    )
    expect(videAutresTaches({ relances: 8, rendezVous: 1 }).titre).toBe(
      'Rien d’autre que vos 8 relances et votre rendez-vous.',
    )
    expect(videAutresTaches({ relances: 1, rendezVous: 1 }).titre).toBe(
      'Rien d’autre que votre relance et votre rendez-vous.',
    )
  })

  it('réserve le vert et « place au terrain » à une journée vraiment finie', () => {
    expect(videAutresTaches({ relances: 0, rendezVous: 0 })).toEqual({
      titre: 'Aucune tâche en attente.',
      texte: 'Rien d’autre à faire aujourd’hui : place au terrain.',
      ton: 'succes',
    })
  })
})
