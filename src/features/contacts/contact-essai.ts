import type { Contact } from './contacts'

/** Fabrique une fiche complète pour les tests ; `valeurs` remplace ce qui doit différer. */
export function contactEssai(valeurs: Partial<Contact> = {}): Contact {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    user_id: '00000000-0000-4000-8000-0000000000aa',
    created_at: '2026-11-16T09:00:00Z',
    updated_at: '2026-11-16T09:00:00Z',
    archived_at: null,
    type: 'personne',
    civilite: null,
    prenom: 'Camille',
    nom: 'Fictif',
    raison_sociale: '',
    telephones: [],
    courriels: [],
    adresse: '',
    code_postal: '',
    ville: '',
    notes: '',
    roles: [],
    etiquettes: [],
    source: null,
    source_detail: '',
    recommande_par_id: null,
    temperature: null,
    nom_tri: '',
    recherche: '',
    fusionne_dans_id: null,
    ...valeurs,
  }
}
